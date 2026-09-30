const mongoose = require('mongoose');

const horseSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'HorseSeller', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'HorseCategory', required: true },
    breed: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['mare', 'stallion', 'gelding'] },
    color: { type: String },
    height: { type: Number }, // hands
    location: { type: String },
    price: { type: Number, required: true },
    description: { type: String },
    photos: [{ type: String }],
    status: { type: String, enum: ['draft', 'pending', 'listed', 'sold', 'removed'], default: 'draft' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Horse', horseSchema);
