const mongoose = require("mongoose");

const residencySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: "Anonymous",
  },
  propertyId: {
    type: String,
    required: true,
  },
  fromYear: {
    type: String,
    required: true,
  },
  toYear: {
    type: String,
    default: "Present",
  },
  description: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  reports: [{
    reportedBy: { type: String, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Residency", residencySchema);
