require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const Horse = require('../src/models/Horse');
const HorseCategory = require('../src/models/HorseCategory');
const HorseSeller = require('../src/models/HorseSeller');
const StoreSeller = require('../src/models/StoreSeller');
const Product = require('../src/models/Product');
const ProductCategory = require('../src/models/ProductCategory');
const ProductSubCategory = require('../src/models/ProductSubCategory');

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function findOrCreateHorseCategory({ name, type, description, image }) {
  let category = await HorseCategory.findOne({ name });
  if (category) return category;
  category = await HorseCategory.create({
    name,
    slug: slugify(name),
    type,
    description,
    image,
    status: 'active',
    isGlobal: true,
    approvalStatus: 'approved',
  });
  console.log(`Created horse category: ${name}`);
  return category;
}

async function findOrCreateProductCategory({ name, description, image }) {
  let category = await ProductCategory.findOne({ name });
  if (category) return category;
  category = await ProductCategory.create({
    name,
    slug: slugify(name),
    description,
    image,
    status: 'active',
  });
  console.log(`Created product category: ${name}`);
  return category;
}

async function findOrCreateProductSubCategory({ name, categoryId }) {
  let sub = await ProductSubCategory.findOne({ name, category: categoryId });
  if (sub) return sub;
  sub = await ProductSubCategory.create({
    name,
    slug: slugify(`${name}-${Date.now()}`),
    category: categoryId,
    status: 'active',
  });
  console.log(`Created product subcategory: ${name}`);
  return sub;
}

async function run() {
  await connectDB();

  // ---- Seller setup ----
  const horseSeller = await HorseSeller.findOne({ phone: '6261387233' });
  if (!horseSeller) throw new Error('Expected existing horse seller (shubham) not found');

  let storeSeller = await StoreSeller.findOne({ phone: '9999900001' });
  if (!storeSeller) {
    storeSeller = await StoreSeller.create({
      name: 'Ashwa Essentials',
      phone: '9999900001',
      email: 'store@ashwaindia.in',
      businessName: 'Ashwa India Essentials',
      status: 'approved',
    });
    console.log('Created store seller: Ashwa India Essentials');
  }

  // ---- Horse categories ----
  const breeds = [
    { name: 'Kathiawari', type: 'Breed', description: 'Kathiawari horses, prized for their inward-curving ears and endurance, native to the Kathiawar peninsula of Gujarat.' },
    { name: 'Thoroughbred', type: 'Breed', description: 'Thoroughbreds, renowned worldwide for speed and agility, widely used in racing and show jumping.' },
    { name: 'Arabian', type: 'Breed', description: 'Arabian horses, one of the oldest breeds, known for stamina, intelligence and a distinctive dished face.' },
    { name: 'Nukra', type: 'Breed', description: 'Nukra horses, a rare hill breed from Himachal Pradesh, sure-footed on mountainous terrain.' },
    { name: 'Manipuri Pony', type: 'Breed', description: 'Manipuri ponies, a small, agile breed from Manipur traditionally used in polo.' },
    { name: 'Zanskari', type: 'Breed', description: 'Zanskari horses, a hardy mountain breed from Ladakh built for high-altitude endurance.' },
    { name: 'Spiti', type: 'Breed', description: 'Spiti ponies, a tough Himalayan breed used for trekking and load-carrying in rugged terrain.' },
    { name: 'Bhutia', type: 'Breed', description: 'Bhutia horses, a sturdy breed from the eastern Himalayas, well suited to cold climates.' },
    { name: 'Kachchhi-Sindhi', type: 'Breed', description: 'Kachchhi-Sindhi horses, a resilient breed from the Kutch region known for working stamina.' },
  ];
  const categoryDocs = {};
  for (const breed of breeds) {
    categoryDocs[breed.name] = await findOrCreateHorseCategory(breed);
  }
  const marwari = await HorseCategory.findOne({ name: 'Marwari' });
  categoryDocs['Marwari'] = marwari;

  // ---- Horses ----
  const horseSeeds = [
    { breed: 'Kathiawari', age: 4, gender: 'stallion', color: 'Grey', height: 14.2, location: 'Rajkot, Gujarat', price: 220000, description: 'Energetic Kathiawari stallion, well trained for riding, with classic curved ears.' },
    { breed: 'Thoroughbred', age: 3, gender: 'gelding', color: 'Chestnut', height: 16.1, location: 'Pune, Maharashtra', price: 575000, description: 'Fast, agile Thoroughbred gelding, imported bloodline, suitable for show jumping.' },
    { breed: 'Arabian', age: 6, gender: 'mare', color: 'White', height: 15.0, location: 'Bikaner, Rajasthan', price: 430000, description: 'Elegant Arabian mare with excellent stamina and a calm, intelligent temperament.' },
    { breed: 'Nukra', age: 5, gender: 'gelding', color: 'Bay', height: 13.0, location: 'Shimla, Himachal Pradesh', price: 150000, description: 'Sure-footed Nukra gelding, ideal for hill terrain and trekking.' },
    { breed: 'Manipuri Pony', age: 4, gender: 'stallion', color: 'Black', height: 11.2, location: 'Imphal, Manipur', price: 180000, description: 'Agile Manipuri pony, traditionally trained for polo, very responsive.' },
    { breed: 'Zanskari', age: 7, gender: 'gelding', color: 'Brown', height: 12.3, location: 'Leh, Ladakh', price: 160000, description: 'Hardy Zanskari horse bred for high-altitude endurance treks.' },
    { breed: 'Spiti', age: 5, gender: 'mare', color: 'Dun', height: 12.0, location: 'Kaza, Himachal Pradesh', price: 140000, description: 'Tough Spiti pony mare, used for mountain load-carrying and trekking tours.' },
    { breed: 'Bhutia', age: 6, gender: 'gelding', color: 'Grey', height: 13.1, location: 'Gangtok, Sikkim', price: 170000, description: 'Cold-climate hardy Bhutia gelding, calm and easy to handle.' },
    { breed: 'Kachchhi-Sindhi', age: 4, gender: 'mare', color: 'Bay', height: 14.0, location: 'Bhuj, Gujarat', price: 210000, description: 'Resilient Kachchhi-Sindhi mare with strong working stamina.' },
    { breed: 'Marwari', age: 6, gender: 'stallion', color: 'Chestnut', height: 15.2, location: 'Jodhpur, Rajasthan', price: 480000, description: 'Majestic Marwari stallion with the breed\'s signature curved ears, royal bloodline.' },
  ];

  let created = 0;
  for (let i = 0; i < horseSeeds.length; i++) {
    const seed = horseSeeds[i];
    const existing = await Horse.findOne({ seller: horseSeller._id, breed: seed.breed, age: seed.age, color: seed.color });
    if (existing) continue;
    await Horse.create({
      seller: horseSeller._id,
      category: categoryDocs[seed.breed]._id,
      breed: seed.breed,
      age: seed.age,
      gender: seed.gender,
      color: seed.color,
      height: seed.height,
      location: seed.location,
      price: seed.price,
      description: seed.description,
      photos: [`https://loremflickr.com/800/600/horse,${slugify(seed.breed)}?lock=${i + 1}`],
      status: 'listed',
    });
    created++;
  }
  console.log(`Horses created: ${created} (skipped existing: ${horseSeeds.length - created})`);

  // ---- Product categories & subcategories ----
  const careCategory = await findOrCreateProductCategory({ name: 'Horse Care', description: 'Grooming and wellness essentials for horses.' });
  const tackCategory = await findOrCreateProductCategory({ name: 'Tack & Equipment', description: 'Riding tack and equipment for horses.' });
  const nutritionCategory = await findOrCreateProductCategory({ name: 'Feed & Nutrition', description: 'Feed, supplements and nutrition for horses.' });

  const subGrooming = await findOrCreateProductSubCategory({ name: 'Grooming', categoryId: careCategory._id });
  const subHealth = await findOrCreateProductSubCategory({ name: 'Health Care', categoryId: careCategory._id });
  const subSaddlery = await findOrCreateProductSubCategory({ name: 'Saddlery', categoryId: tackCategory._id });
  const subProtective = await findOrCreateProductSubCategory({ name: 'Protective Gear', categoryId: tackCategory._id });
  const subFeed = await findOrCreateProductSubCategory({ name: 'Feed', categoryId: nutritionCategory._id });
  const subSupplements = await findOrCreateProductSubCategory({ name: 'Supplements', categoryId: nutritionCategory._id });

  // ---- Products ----
  const productSeeds = [
    { name: 'Premium Horse Shampoo 1L', subCategory: subGrooming, price: 650, stock: 50, description: 'Gentle cleansing shampoo for a shiny, healthy coat.' },
    { name: 'Mane & Tail Detangler Spray', subCategory: subGrooming, price: 450, stock: 60, description: 'Leave-in spray to detangle and condition mane and tail.' },
    { name: 'Body Brush Set (3-Piece)', subCategory: subGrooming, price: 850, stock: 40, description: 'Dandy brush, body brush and curry comb set for daily grooming.' },
    { name: 'Hoof Oil Conditioner 500ml', subCategory: subHealth, price: 550, stock: 45, description: 'Nourishing hoof oil to prevent cracking and promote healthy growth.' },
    { name: 'Fly Repellent Spray 500ml', subCategory: subHealth, price: 480, stock: 70, description: 'Long-lasting fly and insect repellent spray for everyday use.' },
    { name: 'Leather Saddle - All Purpose', subCategory: subSaddlery, price: 28500, stock: 8, description: 'Handcrafted genuine leather all-purpose saddle, available in multiple sizes.' },
    { name: 'Leather Bridle with Reins', subCategory: subSaddlery, price: 6200, stock: 15, description: 'Durable leather bridle set with matching reins.' },
    { name: 'Riding Helmet - ASTM Certified', subCategory: subProtective, price: 3200, stock: 25, description: 'Safety-certified riding helmet with adjustable fit and ventilation.' },
    { name: 'Horse Blanket - Winter Weight', subCategory: subProtective, price: 2800, stock: 30, description: 'Waterproof, breathable winter blanket to keep horses warm.' },
    { name: 'Equine Multivitamin Supplement 2kg', subCategory: subSupplements, price: 1850, stock: 35, description: 'Daily multivitamin and mineral supplement for overall equine health.' },
  ];

  let productsCreated = 0;
  for (let i = 0; i < productSeeds.length; i++) {
    const seed = productSeeds[i];
    const existing = await Product.findOne({ seller: storeSeller._id, name: seed.name });
    if (existing) continue;
    await Product.create({
      seller: storeSeller._id,
      subCategory: seed.subCategory._id,
      name: seed.name,
      price: seed.price,
      stock: seed.stock,
      description: seed.description,
      photos: [`https://loremflickr.com/800/600/horse,equestrian?lock=${i + 20}`],
      status: 'active',
    });
    productsCreated++;
  }
  console.log(`Products created: ${productsCreated} (skipped existing: ${productSeeds.length - productsCreated})`);

  await mongoose.connection.close();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
