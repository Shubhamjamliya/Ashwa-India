require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

async function run() {
  await connectDB();
  const db = mongoose.connection.db;
  const products = db.collection('products');
  const subCategories = db.collection('productsubcategories');

  const subs = await subCategories.find({}).toArray();
  const subToCategory = new Map(subs.map(s => [String(s._id), s.category]));

  const allProducts = await products.find({}).toArray();
  let updated = 0;
  for (const p of allProducts) {
    if (!p.subCategory) continue;
    const categoryId = subToCategory.get(String(p.subCategory));
    if (!categoryId) {
      console.log(`No parent category found for product "${p.name}" (subCategory ${p.subCategory}), skipping`);
      continue;
    }
    await products.updateOne(
      { _id: p._id },
      { $set: { category: categoryId }, $unset: { subCategory: '' } }
    );
    console.log(`Migrated: ${p.name} -> category ${categoryId}`);
    updated++;
  }

  console.log(`Done. Migrated ${updated} of ${allProducts.length} products.`);
  await mongoose.connection.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
