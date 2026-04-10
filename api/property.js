const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  mongoose.set("bufferCommands", false);
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "apartment-properties",
  });
  isConnected = true;
}

module.exports = async (req, res) => {
  await connectDB();
  // Strip /api/property prefix so Express sees /properties, /uploads/*, etc.
  req.url = req.url.replace(/^\/api\/property/, "") || "/";
  const app = require("../services/property-service/src/app");
  return app(req, res);
};
