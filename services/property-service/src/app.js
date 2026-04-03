const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const Property = require("./models/Property");
const authMiddleware = require("./middleware/authMiddleware");
const responseTime = require("./middleware/responseTime");
const healthRoutes = require("./routes/healthRoutes");

const app = express();
app.use(express.json());
app.use(compression());
app.use(responseTime);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(healthRoutes);
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { message: "Too many requests, please try again later." }
});
app.use(limiter);

/* Health check */
app.get("/", (req, res) => {
    res.json({ status: "OK", service: "Property Service", timestamp: new Date().toISOString() });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.post("/properties/upload", authMiddleware, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
    }
    return res.json({
        message: "Image uploaded successfully",
        filename: req.file.filename
    });
});

app.post("/properties/add", authMiddleware, [
    body("addressLine1").trim().notEmpty().withMessage("Address is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("postcode").trim().notEmpty().withMessage("Postcode is required")
        .matches(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i).withMessage("Please enter a valid UK postcode (e.g. SW1A 1AA)"),
    body("imageKey").trim().notEmpty().withMessage("Image is required"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const {
            addressLine1, city, postcode, imageKey,
            price, type, bedrooms, bathrooms, size, yearBuilt
        } = req.body;

        const newProperty = await Property.create({
            addressLine1, city, postcode, imageKey,
            price: price || null,
            type: type || null,
            bedrooms: bedrooms || null,
            bathrooms: bathrooms || null,
            size: size || null,
            yearBuilt: yearBuilt || null,
            createdBy: req.user.id,
        });

        return res.json({
            message: "Property added successfully",
            id: newProperty._id,
            property: newProperty
        });
    } catch (err) {
        console.error("Add Property Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/properties", async (req, res) => {
    try {
        const { postcode, city, type, minPrice, maxPrice, bedrooms } = req.query;
        const filter = {};

        if (postcode) filter.postcode = { $regex: postcode, $options: "i" };
        if (city) filter.city = { $regex: city, $options: "i" };
        if (type) filter.type = type;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (bedrooms) filter.bedrooms = Number(bedrooms);

        const properties = await Property.find(filter).sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        console.error("Get Properties Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/my-properties", authMiddleware, async (req, res) => {
    try {
        const properties = await Property.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        console.error("Get My Properties Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.delete("/properties/:id", authMiddleware, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        if (property.createdBy !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own properties" });
        }

        // Clean up uploaded image file from disk
        if (property.imageKey) {
            const imagePath = path.join(__dirname, "uploads", property.imageKey);
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error("Failed to delete image file:", err.message);
                }
            });
        }

        await Property.findByIdAndDelete(req.params.id);
        res.json({ message: "Property deleted successfully" });
    } catch (err) {
        console.error("Delete Property Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/properties/:id", async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        res.json(property);
    } catch (err) {
        console.error("Get Property Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = app;
