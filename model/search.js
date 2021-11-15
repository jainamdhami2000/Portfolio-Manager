//jshint esversion:6

const mongoose = require('mongoose');
const searchSchema = new mongoose.Schema({
  name_of_security: String,
  nse_quantity_traded: Number,
  nse_deliverable_quantity: String,
  nse_percentage_of_deliverable_quantity_to_traded_quantity: Number,
  nse_close: Number,
  date: Date,
  company_name: String,
  bse_delivery_quantity: Number,
  bse_day_volume: Number,
  bse_delv_per: Number,
});

module.exports = mongoose.model("Searchscript", searchSchema);
