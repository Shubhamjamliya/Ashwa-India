const Horse = require('../models/Horse');
const HorseCategory = require('../models/HorseCategory');
const Inquiry = require('../models/Inquiry');
const HorseSeller = require('../models/HorseSeller');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');

// GET /api/marketplace/horses  (admin: all, horse-seller: own only, public/user: listed only)
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.role === 'horse-seller') {
    filter.seller = req.user._id;
  } else if (req.role !== 'admin') {
    filter.status = 'listed';
  }
  if (req.query.status && req.role === 'admin') filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.location) filter.location = new RegExp(req.query.location.trim(), 'i');
  if (req.query.listingType === 'sale' || req.query.listingType === 'lease') filter.listingType = req.query.listingType;
  if (['mare', 'stallion', 'gelding'].includes(req.query.gender)) filter.gender = req.query.gender;
  const minAge = Number(req.query.minAge);
  const maxAge = Number(req.query.maxAge);
  if (req.query.minAge !== undefined && !Number.isNaN(minAge)) filter.age = { ...filter.age, $gte: minAge };
  if (req.query.maxAge !== undefined && !Number.isNaN(maxAge)) filter.age = { ...filter.age, $lte: maxAge };

  const horses = await Horse.find(filter)
    .populate('seller', 'name businessName phone')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });
  res.json({ horses });
});

exports.getById = asyncHandler(async (req, res) => {
  const horse = await Horse.findById(req.params.id)
    .populate('seller', 'name businessName phone')
    .populate('category', 'name slug');
  if (!horse) return res.status(404).json({ message: 'Horse not found' });
  res.json({ horse });
});

// Sale listings need a price; lease listings need a lease rate.
function listingError(data) {
  const type = data.listingType || 'sale';
  if (type === 'lease' && !(Number(data.leaseRate) > 0)) return 'Enter the lease rate';
  if (type === 'sale' && !(Number(data.price) > 0)) return 'Enter a valid sale price';
  return null;
}

exports.create = asyncHandler(async (req, res) => {
  const error = listingError(req.body);
  if (error) return res.status(400).json({ message: error });
  const horse = await Horse.create({ ...req.body, seller: req.user._id, status: 'pending' });
  res.status(201).json({ horse });
});

exports.update = asyncHandler(async (req, res) => {
  const horse = await Horse.findById(req.params.id);
  if (!horse) return res.status(404).json({ message: 'Horse not found' });
  if (req.role === 'horse-seller' && String(horse.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your listing' });
  }
  const error = listingError({ ...horse.toObject(), ...req.body });
  if (error) return res.status(400).json({ message: error });
  Object.assign(horse, req.body);
  await horse.save();
  res.json({ horse });
});

exports.remove = asyncHandler(async (req, res) => {
  const horse = await Horse.findById(req.params.id);
  if (!horse) return res.status(404).json({ message: 'Horse not found' });
  if (req.role === 'horse-seller' && String(horse.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your listing' });
  }
  await horse.deleteOne();
  res.json({ message: 'Listing removed' });
});

// GET /api/marketplace/sellers  (admin only)
exports.listSellers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const sellers = await HorseSeller.find(filter).sort({ createdAt: -1 });
  res.json({ sellers });
});

exports.updateSellerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'suspended', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const seller = await HorseSeller.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!seller) return res.status(404).json({ message: 'Seller not found' });
  res.json({ seller });
});

// GET /api/marketplace/inquiries
exports.listInquiries = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.role === 'horse-seller') filter.seller = req.user._id;
  const inquiries = await Inquiry.find(filter)
    .populate('horse', 'breed name price photos')
    .populate('buyer', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ inquiries });
});

exports.createInquiry = asyncHandler(async (req, res) => {
  const horse = await Horse.findById(req.body.horseId);
  if (!horse) return res.status(404).json({ message: 'Horse not found' });
  const inquiry = await Inquiry.create({
    horse: horse._id,
    buyer: req.user._id,
    seller: horse.seller,
    message: req.body.message,
    messages: [{ sender: 'user', text: String(req.body.message || '').trim() }],
  });

  const io = req.app.get('io');
  if (io) io.to(`horse-seller:${horse.seller}`).emit('inquiry:new', { inquiryId: String(inquiry._id) });
  pushService
    .sendPushToAccount('horse-seller', horse.seller, {
      title: 'New enquiry about your horse',
      body: `A buyer is interested in ${horse.name || horse.breed}`,
      data: { type: 'inquiry:new', inquiryId: String(inquiry._id) },
    })
    .catch(() => {});

  res.status(201).json({ inquiry });
});

// ---- Horse categories ----
// Admin-created categories are approved + global immediately. Horse-sellers can
// also propose their own categories, which start out pending admin approval and
// private to that seller until approved (and optionally made global).

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(name) {
  const base = slugify(name) || 'category';
  let slug = base;
  let n = 1;
  while (await HorseCategory.findOne({ slug })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

// GET /marketplace/categories
// admin: sees everything. horse-seller: sees approved+global ones plus their own
// (any status). public/others: approved+global only.
exports.listCategories = asyncHandler(async (req, res) => {
  let filter = { approvalStatus: 'approved', isGlobal: true };

  if (req.role === 'admin') {
    filter = {};
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
  } else if (req.role === 'horse-seller') {
    filter = { $or: [{ approvalStatus: 'approved', isGlobal: true }, { createdBy: req.user._id }] };
  }

  const categories = await HorseCategory.find(filter)
    .populate('createdBy', 'name businessName')
    .sort({ name: 1 });
  res.json({ categories });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, type, description, image, status } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });

  const isAdmin = req.role === 'admin';
  const category = await HorseCategory.create({
    name,
    slug: await uniqueSlug(name),
    type,
    description,
    image,
    status: status || 'active',
    createdBy: isAdmin ? null : req.user._id,
    isGlobal: isAdmin,
    approvalStatus: isAdmin ? 'approved' : 'pending',
  });
  res.status(201).json({ category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await HorseCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });

  if (req.role === 'horse-seller') {
    if (!category.createdBy || String(category.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your category' });
    }
  }

  const { name, type, description, image, status } = req.body;
  if (name && name !== category.name) {
    category.name = name;
    category.slug = await uniqueSlug(name);
  }
  if (type !== undefined) category.type = type;
  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;
  if (status !== undefined) category.status = status;

  await category.save();
  res.json({ category });
});

exports.removeCategory = asyncHandler(async (req, res) => {
  const category = await HorseCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });

  if (req.role === 'horse-seller') {
    if (!category.createdBy || String(category.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your category' });
    }
  }

  await category.deleteOne();
  res.json({ message: 'Category removed' });
});

// admin-only category workflow actions

exports.approveCategory = asyncHandler(async (req, res) => {
  const category = await HorseCategory.findByIdAndUpdate(
    req.params.id,
    { approvalStatus: 'approved', rejectionReason: undefined },
    { new: true }
  );
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ category });
});

exports.rejectCategory = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const category = await HorseCategory.findByIdAndUpdate(
    req.params.id,
    { approvalStatus: 'rejected', rejectionReason: reason || '' },
    { new: true }
  );
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ category });
});

exports.makeCategoryGlobal = asyncHandler(async (req, res) => {
  const category = await HorseCategory.findByIdAndUpdate(req.params.id, { isGlobal: true }, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ category });
});
