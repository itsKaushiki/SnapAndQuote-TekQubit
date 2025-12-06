const mongoose = require('mongoose');

const carCostSchema = new mongoose.Schema({
  name: String,
  model: String,
  year: Number,
  parts: {
    bumper: { repair: Number, replace: Number },
    door: { repair: Number, replace: Number },
    headlight: { repair: Number, replace: Number },
    glass: { repair: Number, replace: Number },
    // Add more parts if needed
  },
});

module.exports = mongoose.model('CarCost', carCostSchema);
