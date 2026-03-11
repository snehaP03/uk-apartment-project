/**
 * Response-time middleware — measures and logs request duration.
 * Sets X-Response-Time header before response is sent,
 * and logs slow requests (>1s) to the console.
 */
function responseTime(req, res, next) {
    const start = process.hrtime.bigint();

    // Intercept writeHead to inject the header before it's sent
    const originalWriteHead = res.writeHead.bind(res);
    res.writeHead = function (statusCode, ...args) {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        res.setHeader("X-Response-Time", `${durationMs.toFixed(2)}ms`);
        return originalWriteHead(statusCode, ...args);
    };

    res.on("finish", () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;

        const logLine = `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(2)}ms`;
        if (durationMs > 1000) {
            console.warn(`[SLOW] ${logLine}`);
        } else if (process.env.NODE_ENV !== "test") {
            console.log(logLine);
        }
    });

    next();
}

module.exports = responseTime;
