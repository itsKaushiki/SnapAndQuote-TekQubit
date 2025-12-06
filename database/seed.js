// database/seed.js
const mongoose = require('mongoose');
const CarCost = require('../backend/models/CarCost');
const fs = require('fs');
require('dotenv').config();

const data = JSON.parse(fs.readFileSync('database/sample_cost_data.json', 'utf-8'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Seeding MongoDB...');
  await CarCost.deleteMany({});
  await CarCost.insertMany(data);
  console.log('✅ Done.');
  mongoose.disconnect();
})
.catch(err => console.error('❌ MongoDB Seed Error:', err));
