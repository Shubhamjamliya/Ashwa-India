const mongoose = require('mongoose');

// A purchasable option of a product, e.g. size or colour. Price falls back to the product price when unset.
const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    price: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: false }
);

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreSeller', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    variants: [variantSchema],
    description: { type: String },
    photos: [{ type: String }],
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'active', 'inactive'], default: 'draft' },
  },
  { timestamps: true }
);

productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
