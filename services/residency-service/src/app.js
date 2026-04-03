const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const Residency = require("./models/Residency");
const ContactRequest = require("./models/ContactRequest");
const authMiddleware = require("./middleware/authMiddleware");
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
        max: 200,
        message: { message: "Too many requests, please try again later." }
    });
    app.use(limiter);
}

/* Health check */
app.get("/", (req, res) => {
    res.json({ status: "OK", service: "Residency Service", timestamp: new Date().toISOString() });
});

/* ------------------------------------------------------------------
   Middleware: Admin check
-------------------------------------------------------------------*/
function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
}

/* ------------------------------------------------------------------
   ADD RESIDENCY (status starts as "pending")
-------------------------------------------------------------------*/
app.post("/residencies", authMiddleware, [
    body("propertyId").trim().notEmpty().withMessage("Property ID is required"),
    body("fromYear").trim().notEmpty().withMessage("From year is required"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { propertyId, fromYear, toYear, description } = req.body;

        const newEntry = await Residency.create({
            userId: req.user.id,
            userName: req.user.name || "Anonymous",
            propertyId,
            fromYear,
            toYear: toYear || "Present",
            description: description || "",
            status: "pending",
        });

        return res.json({ message: "Residency submitted for verification", residency: newEntry });
    } catch (err) {
        console.error("Add Residency Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   GET RESIDENTS FOR A PROPERTY (public — shows all with status)
-------------------------------------------------------------------*/
app.get("/properties/:id/residents", async (req, res) => {
    try {
        const data = await Residency.find({ propertyId: req.params.id })
            .sort({ fromYear: -1 });
        return res.json(data);
    } catch (err) {
        console.error("Get Residents Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   GET MY RESIDENCIES
-------------------------------------------------------------------*/
app.get("/my-residencies", authMiddleware, async (req, res) => {
    try {
        const data = await Residency.find({ userId: req.user.id })
            .sort({ fromYear: -1 });
        return res.json(data);
    } catch (err) {
        console.error("Get My Residencies Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   DELETE OWN RESIDENCY
-------------------------------------------------------------------*/
app.delete("/residencies/:id", authMiddleware, async (req, res) => {
    try {
        const residency = await Residency.findById(req.params.id);
        if (!residency) {
            return res.status(404).json({ message: "Residency not found" });
        }
        if (residency.userId !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own residencies" });
        }
        await Residency.findByIdAndDelete(req.params.id);
        return res.json({ message: "Residency deleted successfully" });
    } catch (err) {
        console.error("Delete Residency Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   REPORT A RESIDENCY (flag as fake)
-------------------------------------------------------------------*/
app.post("/residencies/:id/report", authMiddleware, [
    body("reason").trim().notEmpty().withMessage("Reason is required"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const residency = await Residency.findById(req.params.id);
        if (!residency) {
            return res.status(404).json({ message: "Residency not found" });
        }

        // Check if user already reported this
        const alreadyReported = residency.reports.some(
            r => r.reportedBy === req.user.id
        );
        if (alreadyReported) {
            return res.status(409).json({ message: "You have already reported this residency" });
        }

        residency.reports.push({
            reportedBy: req.user.id,
            reason: req.body.reason,
        });
        await residency.save();

        return res.json({ message: "Residency reported. Admin will review." });
    } catch (err) {
        console.error("Report Residency Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   ADMIN: Get all pending residencies
-------------------------------------------------------------------*/
app.get("/admin/residencies/pending", authMiddleware, adminOnly, async (req, res) => {
    try {
        const data = await Residency.find({ status: "pending" })
            .sort({ createdAt: -1 });
        return res.json(data);
    } catch (err) {
        console.error("Admin Get Pending Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   ADMIN: Get all reported residencies
-------------------------------------------------------------------*/
app.get("/admin/residencies/reported", authMiddleware, adminOnly, async (req, res) => {
    try {
        const data = await Residency.find({ "reports.0": { $exists: true } })
            .sort({ createdAt: -1 });
        return res.json(data);
    } catch (err) {
        console.error("Admin Get Reported Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   ADMIN: Verify or reject a residency
-------------------------------------------------------------------*/
app.patch("/admin/residencies/:id", authMiddleware, adminOnly, [
    body("status").isIn(["verified", "rejected"]).withMessage("Status must be verified or rejected"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const residency = await Residency.findById(req.params.id);
        if (!residency) {
            return res.status(404).json({ message: "Residency not found" });
        }

        residency.status = req.body.status;
        await residency.save();

        return res.json({ message: `Residency ${req.body.status}`, residency });
    } catch (err) {
        console.error("Admin Update Residency Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   CONTACT REQUEST ENDPOINTS (unchanged)
-------------------------------------------------------------------*/
app.post("/contact-request", authMiddleware, [
    body("toUserId").trim().notEmpty().withMessage("Recipient is required"),
    body("propertyId").trim().notEmpty().withMessage("Property ID is required"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { toUserId, propertyId, message } = req.body;

        if (toUserId === req.user.id) {
            return res.status(400).json({ message: "Cannot send contact request to yourself" });
        }

        const existing = await ContactRequest.findOne({
            fromUserId: req.user.id,
            toUserId,
            propertyId,
            status: "pending",
        });

        if (existing) {
            return res.status(409).json({ message: "You already have a pending request for this resident" });
        }

        await ContactRequest.create({
            fromUserId: req.user.id,
            fromUserName: req.user.name || "Anonymous",
            fromUserEmail: req.user.email || "",
            toUserId,
            propertyId,
            message: message || "",
        });

        return res.json({ message: "Contact request sent successfully" });
    } catch (err) {
        console.error("Contact Request Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   DELETE OWN CONTACT REQUEST
-------------------------------------------------------------------*/
app.delete("/contact-requests/:requestId", authMiddleware, async (req, res) => {
    try {
        const request = await ContactRequest.findById(req.params.requestId);
        if (!request) {
            return res.status(404).json({ message: "Contact request not found" });
        }
        if (request.fromUserId !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own contact requests" });
        }
        await ContactRequest.findByIdAndDelete(req.params.requestId);
        return res.json({ message: "Contact request deleted successfully" });
    } catch (err) {
        console.error("Delete Contact Request Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/contact-requests/incoming", authMiddleware, async (req, res) => {
    try {
        const requests = await ContactRequest.find({ toUserId: req.user.id })
            .sort({ createdAt: -1 });
        return res.json(requests);
    } catch (err) {
        console.error("Get Incoming Requests Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/contact-requests/outgoing", authMiddleware, async (req, res) => {
    try {
        const requests = await ContactRequest.find({ fromUserId: req.user.id })
            .sort({ createdAt: -1 });
        return res.json(requests);
    } catch (err) {
        console.error("Get Outgoing Requests Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.patch("/contact-requests/:requestId", authMiddleware, [
    body("status").isIn(["accepted", "rejected"]).withMessage("Status must be accepted or rejected"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const request = await ContactRequest.findById(req.params.requestId);

        if (!request) {
            return res.status(404).json({ message: "Contact request not found" });
        }

        if (request.toUserId !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to update this request" });
        }

        request.status = req.body.status;
        await request.save();

        return res.json({ message: `Request ${req.body.status}`, request });
    } catch (err) {
        console.error("Update Request Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = app;
