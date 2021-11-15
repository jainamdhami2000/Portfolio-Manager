//jshint esversion:6

const mongoose = require('mongoose');
const bseSchema = new mongoose.Schema({
  date: Date,
  script_code: Number,
  delivery_quantity: Number,
  delivery_val: Number,
  day_volume: Number,
  day_turnover: Number,
  delv_per: Number,
  symbol: {
    type: String,
    default: null
  },
  company_name: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model("Bsescript", bseSchema);
