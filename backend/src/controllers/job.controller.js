const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const SavedJob = require('../models/SavedJob');
const asyncHandler = require('../utils/asyncHandler');
const { uploadFileBuffer } = require('../services/storage.service');

const { JOB_CATEGORIES, JOB_TYPES } = Job;
const APPLICATION_STATUSES = ['applied', 'shortlisted', 'rejected', 'hired'];

// Users and service providers both post, apply and hire. The role on the request decides how they are stored.
const accountOf = (req) => ({ model: req.role === 'provider' ? 'Provider' : 'User', id: req.user._id });
const sameAccount = (a, model, id) => a.posterModel === model && String(a.poster) === String(id);

// Jobs anyone can see: active and not past the deadline.
function openJobFilter() {
  return {
    status: 'active',
    $or: [{ deadline: { $exists: false } }, { deadline: null }, { deadline: { $gte: new Date() } }],
  };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Contact details the poster chose to show: name and phone from the account.
const posterView = (job) => ({ name: job.posterName, phone: job.posterPhone });

// ---------- Browsing and applying (user and provider) ----------

// GET /api/jobs?q=&category=&city=  — jobs open for applications
exports.listJobs = asyncHandler(async (req, res) => {
  const filter = openJobFilter();
  const { q, category, city } = req.query;
  if (category) {
    if (!JOB_CATEGORIES.includes(category)) return res.status(400).json({ message: 'Unknown job category' });
    filter.category = category;
  }
  if (city) filter.city = new RegExp(`^${escapeRegex(String(city).trim())}$`, 'i');
  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
    filter.$and = [{ $or: [{ title: rx }, { description: rx }, { city: rx }] }];
  }

  const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(100);

  const { model, id } = accountOf(req);
  const ids = jobs.map((j) => j._id);
  const [applied, saved] = await Promise.all([
    JobApplication.find({ applicantModel: model, applicant: id, job: { $in: ids } }).select('job status'),
    SavedJob.find({ accountModel: model, account: id, job: { $in: ids } }).select('job'),
  ]);
  const appliedMap = Object.fromEntries(applied.map((a) => [String(a.job), a.status]));
  const savedSet = new Set(saved.map((s) => String(s.job)));

  res.json({
    jobs: jobs.map((j) => ({
      ...j.toObject(),
      isMine: sameAccount(j, model, id),
      applicationStatus: appliedMap[String(j._id)] || null,
      saved: savedSet.has(String(j._id)),
    })),
    categories: JOB_CATEGORIES,
  });
});

// GET /api/jobs/:id — job detail with poster contact and this account's application and save state
exports.jobDetail = asyncHandler(async (req, res) => {
  const { model, id } = accountOf(req);
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  // The poster and admins can see a job in any state. Everyone else only sees open jobs.
  const isPoster = sameAccount(job, model, id);
  if (!isPoster && (job.status !== 'active' || (job.deadline && job.deadline < new Date()))) {
    return res.status(404).json({ message: 'This job is no longer open' });
  }

  const [application, saved] = await Promise.all([
    JobApplication.findOne({ job: job._id, applicantModel: model, applicant: id }),
    SavedJob.exists({ job: job._id, accountModel: model, account: id }),
  ]);
  res.json({
    job: { ...job.toObject(), poster: undefined, posterModel: undefined, contact: posterView(job) },
    isPoster,
    application,
    saved: Boolean(saved),
  });
});

// POST /api/jobs/:id/apply  { coverNote, resume: { url, filename } }
exports.apply = asyncHandler(async (req, res) => {
  const { model, id } = accountOf(req);
  const job = await Job.findOne({ _id: req.params.id, ...openJobFilter() });
  if (!job) return res.status(404).json({ message: 'This job is no longer open' });
  if (sameAccount(job, model, id)) return res.status(400).json({ message: 'You cannot apply to your own job' });

  const { coverNote, resume } = req.body;
  if (resume && (!resume.url || typeof resume.url !== 'string')) {
    return res.status(400).json({ message: 'Upload your resume before applying' });
  }

  try {
    const application = await JobApplication.create({
      job: job._id,
      applicantModel: model,
      applicant: id,
      applicantName: req.user.name,
      applicantPhone: req.user.phone,
      coverNote: coverNote ? String(coverNote).trim().slice(0, 1000) : undefined,
      resume: resume ? { url: resume.url, filename: resume.filename, uploadedAt: new Date() } : undefined,
    });
    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You have already applied for this job' });
    throw err;
  }
});

// GET /api/jobs/mine/applications — jobs this account applied for
exports.myApplications = asyncHandler(async (req, res) => {
  const { model, id } = accountOf(req);
  const applications = await JobApplication.find({ applicantModel: model, applicant: id })
    .populate('job', 'title category city status posterName')
    .sort({ createdAt: -1 });
  res.json({ applications: applications.filter((a) => a.job) });
});

// GET /api/jobs/mine/saved
exports.mySaved = asyncHandler(async (req, res) => {
  const { model, id } = accountOf(req);
  const saved = await SavedJob.find({ accountModel: model, account: id }).populate('job').sort({ createdAt: -1 });
  res.json({ jobs: saved.filter((s) => s.job).map((s) => ({ ...s.job.toObject(), saved: true })) });
});

// POST /api/jobs/:id/save — toggles the bookmark
exports.toggleSave = asyncHandler(async (req, res) => {
  const { model, id } = accountOf(req);
  const existing = await SavedJob.findOneAndDelete({ job: req.params.id, accountModel: model, account: id });
  if (existing) return res.json({ saved: false });
  if (!(await Job.exists({ _id: req.params.id }))) return res.status(404).json({ message: 'Job not found' });
  await SavedJob.create({ job: req.params.id, accountModel: model, account: id });
  res.json({ saved: true });
});

// POST /api/jobs/resume  (multipart, field "file") — PDF only, stored as-is
exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'Choose a PDF resume' });
  const stored = uploadFileBuffer(req.file.buffer, req.file.originalname, '.pdf');
  res.status(201).json({ resume: { url: stored.url, filename: req.file.originalname, uploadedAt: new Date() } });
});

// ---------- Posting and hiring (user and provider) ----------

const JOB_FIELDS = ['title', 'category', 'jobType', 'city', 'address', 'experienceYears', 'salaryText', 'openings', 'description', 'requirements', 'deadline'];

function pickJob(body) {
  const out = {};
  for (const key of JOB_FIELDS) if (body[key] !== undefined) out[key] = body[key];
  if (out.deadline === '') out.deadline = null;
  return out;
}

function validateJob(data, { partial = false } = {}) {
  if (!partial) {
    for (const key of ['title', 'category', 'city', 'description']) {
      if (!data[key] || !String(data[key]).trim()) return `${key} is required`;
    }
  }
  if (data.category && !JOB_CATEGORIES.includes(data.category)) return 'Unknown job category';
  if (data.jobType && !JOB_TYPES.includes(data.jobType)) return 'Unknown job type';
  if (data.openings !== undefined && !(Number(data.openings) >= 1)) return 'Openings must be 1 or more';
  return null;
}

// POST /api/jobs  — post a job
exports.createJob = asyncHandler(async (req, res) => {
  const data = pickJob(req.body);
  const error = validateJob(data);
  if (error) return res.status(400).json({ message: error });
  const { model, id } = accountOf(req);
  const job = await Job.create({
    ...data,
    poster: id,
    posterModel: model,
    posterName: req.user.name || req.user.businessName,
    posterPhone: req.user.phone,
  });
  res.status(201).json({ job });
});

// GET /api/jobs/mine/posted — jobs this account posted, with applicant counts
exports.myPosted = asyncHandler(async (req, res) => {
  const { model, id } = accountOf(req);
  const jobs = await Job.find({ posterModel: model, poster: id }).sort({ createdAt: -1 });
  const counts = await JobApplication.aggregate([
    { $match: { job: { $in: jobs.map((j) => j._id) } } },
    { $group: { _id: '$job', applicants: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.applicants]));
  res.json({ jobs: jobs.map((j) => ({ ...j.toObject(), applicants: countMap[String(j._id)] || 0 })) });
});

// Loads a job this account posted, or responds with an error.
async function ownJob(req, res) {
  const { model, id } = accountOf(req);
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404).json({ message: 'Job not found' });
    return null;
  }
  if (!sameAccount(job, model, id)) {
    res.status(403).json({ message: 'Only the person who posted this job can manage it' });
    return null;
  }
  return job;
}

// GET /api/jobs/:id/applicants — poster's view of applicants
exports.applicants = asyncHandler(async (req, res) => {
  const job = await ownJob(req, res);
  if (!job) return;
  const applications = await JobApplication.find({ job: job._id }).sort({ createdAt: 1 });
  res.json({ job, applications });
});

// PATCH /api/jobs/:id  — poster edits the job or changes its status (active, paused, closed)
exports.updateJob = asyncHandler(async (req, res) => {
  const job = await ownJob(req, res);
  if (!job) return;
  const data = pickJob(req.body);
  const error = validateJob(data, { partial: true });
  if (error) return res.status(400).json({ message: error });
  if (req.body.status !== undefined) {
    if (!['active', 'paused', 'closed'].includes(req.body.status)) return res.status(400).json({ message: 'Unknown job status' });
    if (job.status === 'filled') return res.status(400).json({ message: 'This job is already filled' });
    data.status = req.body.status;
  }
  Object.assign(job, data);
  await job.save();
  res.json({ job });
});

// PATCH /api/jobs/:id/applications/:applicationId  { status: shortlisted | rejected | hired | applied }
// Hiring counts toward the openings. When all openings are filled, the job closes automatically.
exports.decideApplication = asyncHandler(async (req, res) => {
  const job = await ownJob(req, res);
  if (!job) return;
  const { status } = req.body;
  if (!APPLICATION_STATUSES.includes(status)) return res.status(400).json({ message: 'Unknown application status' });

  const application = await JobApplication.findOne({ _id: req.params.applicationId, job: job._id });
  if (!application) return res.status(404).json({ message: 'Application not found' });

  const wasHired = application.status === 'hired';
  if (status === 'hired' && !wasHired) {
    if (job.hiredCount >= job.openings) return res.status(400).json({ message: 'All openings for this job are already filled' });
    job.hiredCount += 1;
  } else if (status !== 'hired' && wasHired) {
    job.hiredCount = Math.max(0, job.hiredCount - 1);
  }
  application.status = status;
  await application.save();

  if (job.hiredCount >= job.openings && job.status !== 'closed') job.status = 'filled';
  else if (job.status === 'filled' && job.hiredCount < job.openings) job.status = 'active';
  await job.save();

  res.json({ application, job });
});

// ---------- Admin: oversight ----------

// GET /api/jobs/admin/jobs?status=
exports.listAdminJobs = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(500);
  const counts = await JobApplication.aggregate([{ $group: { _id: '$job', applicants: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.applicants]));
  res.json({ jobs: jobs.map((j) => ({ ...j.toObject(), applicants: countMap[String(j._id)] || 0 })) });
});

// PATCH /api/jobs/admin/jobs/:id  { status: active | paused | closed }
exports.adminSetJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'paused', 'closed'].includes(status)) return res.status(400).json({ message: 'Unknown job status' });
  const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ job });
});
