const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Prices a cart from the server's own data. Client-side prices and stock are never trusted.
async function priceCart(items, couponCode) {
  if (!Array.isArray(items) || items.length === 0) throw fail('At least one item is required');

  const ids = [...new Set(items.map((i) => String(i.productId)))];
  const products = await Product.find({ _id: { $in: ids }, status: 'active' });
  if (products.length !== ids.length) throw fail('One or more products are unavailable');
  if (new Set(products.map((p) => String(p.seller))).size > 1) {
    throw fail('All items in one order must be from the same seller');
  }

  const lines = items.map((i) => {
    const product = products.find((p) => String(p._id) === String(i.productId));
    const quantity = Math.max(1, Number(i.quantity) || 1);

    let variant = null;
    if (i.variantId) {
      variant = product.variants.id(i.variantId);
      if (!variant) throw fail(`Choose a valid option for ${product.name}`);
    } else if (product.variants && product.variants.length) {
      throw fail(`Choose an option for ${product.name}`);
    }

    const stock = variant ? variant.stock : product.stock;
    if (stock < quantity) {
      const option = variant ? ` (${variant.label})` : '';
      throw fail(stock > 0 ? `Only ${stock} left of ${product.name}${option}` : `${product.name}${option} is out of stock`);
    }

    const unitPrice = variant && variant.price != null ? variant.price : product.price;
    return { product, variant, quantity, unitPrice, lineTotal: unitPrice * quantity };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const applied = couponCode ? await applyCoupon(couponCode, subtotal) : { discount: 0, coupon: null };

  return {
    lines,
    sellerId: products[0].seller,
    subtotal,
    discount: applied.discount,
    couponCode: applied.coupon ? applied.coupon.code : undefined,
    total: subtotal - applied.discount,
  };
}

async function applyCoupon(code, subtotal) {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon || !coupon.active) throw fail('This coupon code is not valid');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw fail('This coupon has expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw fail('This coupon has been fully used');
  if (subtotal < coupon.minOrder) throw fail(`Add ₹${coupon.minOrder - subtotal} more to use this coupon`);

  let discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(Math.round(discount), subtotal);
  return { discount, coupon };
}

// Reduces stock for every line. Variant stock is tracked per option, product stock otherwise.
async function decrementStock(lines) {
  await Promise.all(
    lines.map((l) =>
      l.variant
        ? Product.updateOne({ _id: l.product._id, 'variants._id': l.variant._id }, { $inc: { 'variants.$.stock': -l.quantity } })
        : Product.updateOne({ _id: l.product._id }, { $inc: { stock: -l.quantity } })
    )
  );
}

async function restoreStock(orderItems) {
  await Promise.all(
    orderItems.map((i) =>
      i.variantId
        ? Product.updateOne({ _id: i.product, 'variants._id': i.variantId }, { $inc: { 'variants.$.stock': i.quantity } })
        : Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })
    )
  );
}

module.exports = { priceCart, applyCoupon, decrementStock, restoreStock, fail };
