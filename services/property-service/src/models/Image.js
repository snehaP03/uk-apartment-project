const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  data: { type: String, required: true },       // base64-encoded image
  contentType: { type: String, required: true }, // e.g. image/jpeg
  filename: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Image", imageSchema);
