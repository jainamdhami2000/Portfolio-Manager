//jshint esversion:6

const mongoose = require('mongoose');
const nseSchema = new mongoose.Schema({
  record_type: Number,
  name_of_security: String,
  settlement_type: String,
  quantity_traded: Number,
  deliverable_quantity: Number,
  percentage_of_deliverable_quantity_to_traded_quantity: Number,
  date: Date,
  company_name: {
    type: String,
    default: null
  },
  script_code: {
    type: Number,
    default: null
  },
  close: {
    type: Number,
    default: null
  }
});
// nseSchema.ensureIndex({ date: 1, name_of_security: 1 }, { unique: true , dropDups : true});
module.exports = mongoose.model("Nsescript", nseSchema);
