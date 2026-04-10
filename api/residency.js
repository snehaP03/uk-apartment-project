const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  mongoose.set("bufferCommands", false);
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "apartment-residencies",
  });
  isConnected = true;
}

module.exports = async (req, res) => {
  await connectDB();
  // Strip /api/residency prefix so Express sees /residencies, /contact-request, etc.
  req.url = req.url.replace(/^\/api\/residency/, "") || "/";
  const app = require("../services/residency-service/src/app");
  return app(req, res);
};
