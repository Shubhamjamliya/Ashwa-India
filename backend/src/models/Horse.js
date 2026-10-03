const mongoose = require('mongoose');

const SCOPE_OF_WORK = ['riding', 'racing', 'breeding', 'showing', 'pleasure', 'trekking', 'therapy', 'draught'];
const TRAINING_LEVELS = ['unbroken', 'green', 'basic', 'intermediate', 'advanced', 'trained'];
const VACCINATION_STATUS = ['complete', 'partial', 'none', 'unknown'];

const horseSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'HorseSeller', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'HorseCategory', required: true },
    name: { type: String, trim: true },
    breed: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['mare', 'stallion', 'gelding'] },
    color: { type: String },
    height: { type: Number }, // hands
    discipline: { type: String, trim: true },
    scopeOfWork: [{ type: String, enum: SCOPE_OF_WORK }],
    trainingLevel: { type: String, enum: TRAINING_LEVELS },
    health: {
      vaccinationStatus: { type: String, enum: VACCINATION_STATUS, default: 'unknown' },
      notes: { type: String, trim: true },
    },
    registration: {
      registry: { type: String, trim: true },
      number: { type: String, trim: true },
    },
    location: { type: String },
    listingType: { type: String, enum: ['sale', 'lease'], default: 'sale' },
    // Sale price. Required only for sale listings; lease listings use leaseRate.
    price: { type: Number, required: function requiredForSale() { return this.listingType !== 'lease'; } },
    leaseRate: { type: Number, min: 0 },
    leasePeriod: { type: String, enum: ['day', 'week', 'month', 'year'], default: 'month' },
    priceNegotiable: { type: Boolean, default: false },
    description: { type: String },
    photos: [{ type: String }],
    videos: [{ type: String }],
    status: { type: String, enum: ['draft', 'pending', 'listed', 'sold', 'removed'], default: 'draft' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Horse', horseSchema);
module.exports.SCOPE_OF_WORK = SCOPE_OF_WORK;
module.exports.TRAINING_LEVELS = TRAINING_LEVELS;
module.exports.VACCINATION_STATUS = VACCINATION_STATUS;
