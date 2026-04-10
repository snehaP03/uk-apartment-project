const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  mongoose.set("bufferCommands", false);
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "apartment-auth",
  });
  isConnected = true;
}

module.exports = async (req, res) => {
  await connectDB();
  // Strip /api/auth prefix so Express sees /auth/login, /auth/register, etc.
  req.url = req.url.replace(/^\/api\/auth/, "") || "/";
  const app = require("../services/auth-service/src/app");
  return app(req, res);
};
