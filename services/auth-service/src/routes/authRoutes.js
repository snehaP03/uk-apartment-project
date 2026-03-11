const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { sendVerificationEmail } = require("../utils/mailer");

const router = express.Router();

/* ------------------------------------------------------------------
   Helper: Generate JWT
-------------------------------------------------------------------*/
function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );
}

/* ------------------------------------------------------------------
   Helper: Generate 6-digit verification code
-------------------------------------------------------------------*/
function generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
}

/* ------------------------------------------------------------------
   REGISTER USER
-------------------------------------------------------------------*/
router.post("/register", [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateVerificationCode();

        // Auto-verify if no email service configured, otherwise send OTP
        const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS
            && process.env.EMAIL_USER !== "your-email@gmail.com";

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            isVerified: !emailConfigured,
            verificationCode: emailConfigured ? verificationCode : null,
            verificationCodeExpires: emailConfigured ? new Date(Date.now() + 15 * 60 * 1000) : null,
        });

        if (emailConfigured) {
            try {
                await sendVerificationEmail(email, verificationCode);
            } catch (emailErr) {
                console.error("Email send failed:", emailErr.message);
            }

            return res.status(201).json({
                message: "Registration successful. Please check your email for verification code.",
                userId: newUser._id,
                requiresVerification: true,
            });
        }

        return res.status(201).json({
            message: "Registration successful. You can now log in.",
            userId: newUser._id,
            requiresVerification: false,
        });

    } catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   VERIFY EMAIL
-------------------------------------------------------------------*/
router.post("/verify-email", [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("code").trim().isLength({ min: 6, max: 6 }).withMessage("Invalid verification code"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { email, code } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: "Email is already verified." });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ error: "Invalid verification code." });
        }

        if (user.verificationCodeExpires < new Date()) {
            return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        return res.json({ message: "Email verified successfully. You can now log in." });

    } catch (err) {
        console.error("Verify Email Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   RESEND VERIFICATION CODE
-------------------------------------------------------------------*/
router.post("/resend-code", [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: "Email is already verified." });
        }

        const verificationCode = generateVerificationCode();
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        try {
            await sendVerificationEmail(email, verificationCode);
        } catch (emailErr) {
            console.error("Email send failed:", emailErr.message);
            return res.status(500).json({ error: "Failed to send verification email." });
        }

        return res.json({ message: "New verification code sent to your email." });

    } catch (err) {
        console.error("Resend Code Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   LOGIN USER
-------------------------------------------------------------------*/
router.post("/login", [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                error: "Email not verified. Please check your email for the verification code.",
                requiresVerification: true,
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password." });
        }

        const token = generateToken(user);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ------------------------------------------------------------------
   GET CURRENT USER (protected)
-------------------------------------------------------------------*/
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error("Get User Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
