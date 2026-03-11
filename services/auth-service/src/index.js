const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = require("./app");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/apartment-auth";
const PORT = process.env.PORT || 5001;

let server;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Auth Service connected to MongoDB");
        server = app.listen(PORT, () => {
            console.log(`Auth Service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    });

/* Graceful shutdown */
function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (server) {
        server.close(() => {
            console.log("HTTP server closed");
            mongoose.connection.close(false).then(() => {
                console.log("MongoDB connection closed");
                process.exit(0);
            });
        });
    }
    setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
