const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  addressLine1: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  postcode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  imageKey: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: null,
  },
  type: {
    type: String,
    default: null,
  },
  bedrooms: {
    type: Number,
    default: null,
  },
  bathrooms: {
    type: Number,
    default: null,
  },
  size: {
    type: Number,
    default: null,
  },
  yearBuilt: {
    type: Number,
    default: null,
  },
  createdBy: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Property", propertySchema);
