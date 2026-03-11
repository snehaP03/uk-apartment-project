const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const responseTime = require("./middleware/responseTime");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.use(express.json());
app.use(compression());
app.use(responseTime);
app.use(helmet());
app.use(healthRoutes);
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

if (process.env.NODE_ENV !== "test") {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: "Too many requests, please try again later." }
    });
    app.use(limiter);

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: { error: "Too many login attempts, please try again later." }
    });
    app.use("/auth", authLimiter);
}

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "Auth Service",
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
