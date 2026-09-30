const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreSeller', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSubCategory', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    description: { type: String },
    photos: [{ type: String }],
    status: { type: String, enum: ['draft', 'active', 'inactive'], default: 'draft' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
