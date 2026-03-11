const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const SERVICE_NAME = "Auth Service";
const startTime = Date.now();

router.get("/health", (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();

    const dbState = mongoose.connection.readyState;
    const dbStatus = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };

    res.json({
        status: dbState === 1 ? "healthy" : "degraded",
        service: SERVICE_NAME,
        timestamp: new Date().toISOString(),
        uptime: `${uptime}s`,
        database: dbStatus[dbState] || "unknown",
        memory: {
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        },
        environment: process.env.NODE_ENV || "development",
    });
});

module.exports = router;
