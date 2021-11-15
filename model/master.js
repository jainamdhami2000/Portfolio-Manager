//jshint esversion:6

const mongoose = require('mongoose');
const masterSchema = new mongoose.Schema({
  script_code:Number,
  company_name:String,
  symbol: String
});

module.exports = mongoose.model("Master", masterSchema);
