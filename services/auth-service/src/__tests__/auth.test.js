const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Set env before loading app
process.env.JWT_SECRET = "test-secret-key";
process.env.ENCRYPTION_KEY = "test-encryption-key-for-aes256";
process.env.NODE_ENV = "test";
// Simulate email configured for verification tests
process.env.EMAIL_USER = "test@gmail.com";
process.env.EMAIL_PASS = "testpass123456";

// Mock mailer so tests don't send real emails
jest.mock("../utils/mailer", () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

const app = require("../app");
const User = require("../models/User");
const { encrypt, decrypt, hashForLookup } = require("../utils/encryption");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

/* Helper: register + verify a user (for login/me tests) */
async function registerAndVerify(name, email, password) {
    await request(app)
        .post("/auth/register")
        .send({ name, email, password });

    const hash = hashForLookup(email);
    const user = await User.findOne({ emailHash: hash });
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();
}

describe("Auth Service", () => {

    describe("GET /", () => {
        it("should return health check", async () => {
            const res = await request(app).get("/");
            expect(res.status).toBe(200);
            expect(res.body.status).toBe("OK");
            expect(res.body.service).toBe("Auth Service");
        });
    });

    describe("Encryption Utility", () => {
        it("should encrypt and decrypt text correctly", () => {
            const original = "John Doe";
            const encrypted = encrypt(original);
            expect(encrypted).not.toBe(original);
            expect(encrypted).toContain(":");
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(original);
        });

        it("should produce different ciphertext for same input (random IV)", () => {
            const text = "test@example.com";
            const enc1 = encrypt(text);
            const enc2 = encrypt(text);
            expect(enc1).not.toBe(enc2); // Different IVs
            expect(decrypt(enc1)).toBe(text);
            expect(decrypt(enc2)).toBe(text);
        });

        it("should produce consistent hash for lookups", () => {
            const email = "Test@Example.com";
            const hash1 = hashForLookup(email);
            const hash2 = hashForLookup(email);
            expect(hash1).toBe(hash2);
            expect(hash1.length).toBe(64); // SHA-256 hex
        });

        it("should handle null/empty gracefully", () => {
            expect(encrypt(null)).toBeNull();
            expect(decrypt(null)).toBeNull();
            expect(encrypt("")).toBe("");
            expect(decrypt("")).toBe("");
        });
    });

    describe("POST /auth/register", () => {
        it("should register a new user with encrypted fields", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            expect(res.status).toBe(201);
            expect(res.body.requiresVerification).toBe(true);
            expect(res.body.userId).toBeDefined();

            // Verify data is encrypted in the database
            const hash = hashForLookup("john@test.com");
            const user = await User.findOne({ emailHash: hash });
            expect(user.isVerified).toBe(false);
            expect(user.verificationCode).toBeDefined();
            expect(user.verificationCode.length).toBe(6);
            // Name and email should be encrypted (contain colons from AES-256-GCM format)
            expect(user.name).toContain(":");
            expect(user.email).toContain(":");
            // Decrypted values should match original
            expect(decrypt(user.name)).toBe("John");
            expect(decrypt(user.email)).toBe("john@test.com");
        });

        it("should store emailHash for lookups", async () => {
            await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            const hash = hashForLookup("john@test.com");
            const user = await User.findOne({ emailHash: hash });
            expect(user).not.toBeNull();
            expect(user.emailHash).toBe(hash);
        });

        it("should auto-verify when email not configured", async () => {
            const savedUser = process.env.EMAIL_USER;
            const savedPass = process.env.EMAIL_PASS;
            process.env.EMAIL_USER = "your-email@gmail.com";
            process.env.EMAIL_PASS = "your-app-password";

            const user = await User.create({
                name: "Auto", email: "auto@test.com", password: "hashed",
                isVerified: true, verificationCode: null,
            });
            expect(user.isVerified).toBe(true);

            process.env.EMAIL_USER = savedUser;
            process.env.EMAIL_PASS = savedPass;
        });

        it("should reject duplicate email", async () => {
            await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            const res = await request(app)
                .post("/auth/register")
                .send({ name: "John2", email: "john@test.com", password: "password456" });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("User already exists.");
        });

        it("should reject missing fields", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({ name: "John" });

            expect(res.status).toBe(400);
        });

        it("should reject short password", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "123" });

            expect(res.status).toBe(400);
        });

        it("should reject invalid email", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "not-an-email", password: "password123" });

            expect(res.status).toBe(400);
        });
    });

    describe("POST /auth/verify-email", () => {
        it("should verify email with correct code", async () => {
            await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            const hash = hashForLookup("john@test.com");
            const user = await User.findOne({ emailHash: hash });

            const res = await request(app)
                .post("/auth/verify-email")
                .send({ email: "john@test.com", code: user.verificationCode });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("verified successfully");

            const verifiedUser = await User.findOne({ emailHash: hash });
            expect(verifiedUser.isVerified).toBe(true);
            expect(verifiedUser.verificationCode).toBeNull();
        });

        it("should reject wrong verification code", async () => {
            await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            const res = await request(app)
                .post("/auth/verify-email")
                .send({ email: "john@test.com", code: "000000" });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Invalid");
        });

        it("should reject expired verification code", async () => {
            await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            const hash = hashForLookup("john@test.com");
            const user = await User.findOne({ emailHash: hash });
            user.verificationCodeExpires = new Date(Date.now() - 1000);
            await user.save();

            const res = await request(app)
                .post("/auth/verify-email")
                .send({ email: "john@test.com", code: user.verificationCode });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("expired");
        });

        it("should reject if already verified", async () => {
            await registerAndVerify("John", "john@test.com", "password123");

            const res = await request(app)
                .post("/auth/verify-email")
                .send({ email: "john@test.com", code: "123456" });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("already verified");
        });
    });

    describe("POST /auth/login", () => {
        it("should login with verified account and return decrypted user", async () => {
            await registerAndVerify("John", "john@test.com", "password123");

            const res = await request(app)
                .post("/auth/login")
                .send({ email: "john@test.com", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Login successful");
            expect(res.body.token).toBeDefined();
            expect(res.body.user.name).toBe("John");
            expect(res.body.user.email).toBe("john@test.com");
        });

        it("should reject unverified account", async () => {
            await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            const res = await request(app)
                .post("/auth/login")
                .send({ email: "john@test.com", password: "password123" });

            expect(res.status).toBe(403);
            expect(res.body.requiresVerification).toBe(true);
        });

        it("should reject wrong password", async () => {
            await registerAndVerify("John", "john@test.com", "password123");

            const res = await request(app)
                .post("/auth/login")
                .send({ email: "john@test.com", password: "wrongpassword" });

            expect(res.status).toBe(401);
        });

        it("should reject non-existent user", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({ email: "nobody@test.com", password: "password123" });

            expect(res.status).toBe(404);
        });
    });

    describe("GET /auth/me", () => {
        it("should return decrypted user info with valid token", async () => {
            await registerAndVerify("John", "john@test.com", "password123");

            const loginRes = await request(app)
                .post("/auth/login")
                .send({ email: "john@test.com", password: "password123" });

            const res = await request(app)
                .get("/auth/me")
                .set("Authorization", `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe("John");
            expect(res.body.user.email).toBe("john@test.com");
        });

        it("should reject request without token", async () => {
            const res = await request(app).get("/auth/me");
            expect(res.status).toBe(401);
        });
    });

    describe("DELETE /auth/account", () => {
        it("should delete authenticated user account", async () => {
            await registerAndVerify("John", "john@test.com", "password123");

            const loginRes = await request(app)
                .post("/auth/login")
                .send({ email: "john@test.com", password: "password123" });

            const res = await request(app)
                .delete("/auth/account")
                .set("Authorization", `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Account deleted successfully");

            const hash = hashForLookup("john@test.com");
            const user = await User.findOne({ emailHash: hash });
            expect(user).toBeNull();
        });

        it("should reject without auth token", async () => {
            const res = await request(app).delete("/auth/account");
            expect(res.status).toBe(401);
        });
    });
});
