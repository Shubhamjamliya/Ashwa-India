const express = require('express');
const multer = require('multer');
const router = express.Router();
const jobs = require('../controllers/job.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Resumes are PDFs, so they get their own upload rule (images stay on /uploads/image).
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Resume must be a PDF file'));
    cb(null, true);
  },
});

// Users and service providers are both posters and applicants.
const member = [protect, authorize('user', 'provider')];

// Literal paths first so they are not read as a job id.
router.get('/mine/applications', ...member, jobs.myApplications);
router.get('/mine/saved', ...member, jobs.mySaved);
router.get('/mine/posted', ...member, jobs.myPosted);
router.post('/resume', ...member, resumeUpload.single('file'), jobs.uploadResume);

router.get('/', ...member, jobs.listJobs);
router.post('/', ...member, jobs.createJob);
router.get('/:id', ...member, jobs.jobDetail);
router.patch('/:id', ...member, jobs.updateJob);
router.get('/:id/applicants', ...member, jobs.applicants);
router.patch('/:id/applications/:applicationId', ...member, jobs.decideApplication);
router.post('/:id/apply', ...member, jobs.apply);
router.post('/:id/save', ...member, jobs.toggleSave);

// Admin: oversight only
const admin = [protect, authorize('admin')];
router.get('/admin/jobs', ...admin, jobs.listAdminJobs);
router.patch('/admin/jobs/:id', ...admin, jobs.adminSetJobStatus);

module.exports = router;
