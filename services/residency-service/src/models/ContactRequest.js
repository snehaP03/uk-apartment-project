const mongoose = require("mongoose");

const contactRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: String,
    required: true,
  },
  fromUserName: {
    type: String,
    required: true,
  },
  fromUserEmail: {
    type: String,
    required: true,
  },
  toUserId: {
    type: String,
    required: true,
  },
  propertyId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ContactRequest", contactRequestSchema);
