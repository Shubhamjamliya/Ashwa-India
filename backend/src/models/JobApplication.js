const mongoose = require('mongoose');

// One application per applicant per job. Applicants are users or service providers.
const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    applicantModel: { type: String, enum: ['User', 'Provider'], required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'applicantModel' },
    applicantName: { type: String, trim: true },
    applicantPhone: { type: String, trim: true },
    coverNote: { type: String, trim: true, maxlength: 1000 },
    resume: { url: String, filename: String, uploadedAt: Date },
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'hired'], default: 'applied', index: true },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
