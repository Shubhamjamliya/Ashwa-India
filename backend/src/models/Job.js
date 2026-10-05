const mongoose = require('mongoose');

// Horse-related job categories. Keep in sync with the frontend filter chips.
const JOB_CATEGORIES = ['trainer', 'groom', 'stable-manager', 'rider', 'veterinarian', 'driver'];
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance'];

// Any user or service provider can post a job. The poster reviews applicants and hires.
const jobSchema = new mongoose.Schema(
  {
    poster: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'posterModel', index: true },
    posterModel: { type: String, enum: ['User', 'Provider', 'Transporter'], required: true },
    posterName: { type: String, trim: true },
    posterPhone: { type: String, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: JOB_CATEGORIES, required: true, index: true },
    jobType: { type: String, enum: JOB_TYPES, default: 'full-time' },
    city: { type: String, required: true, trim: true, index: true },
    address: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    salaryText: { type: String, trim: true, maxlength: 80 }, // e.g. "₹20,000 - ₹28,000 / month"
    openings: { type: Number, min: 1, default: 1 },
    hiredCount: { type: Number, min: 0, default: 0 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    requirements: { type: String, trim: true, maxlength: 2000 },
    deadline: { type: Date },
    // active: open for applications. paused: hidden temporarily. filled: all openings hired. closed: poster ended it.
    status: { type: String, enum: ['active', 'paused', 'filled', 'closed'], default: 'active', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
module.exports.JOB_CATEGORIES = JOB_CATEGORIES;
module.exports.JOB_TYPES = JOB_TYPES;
