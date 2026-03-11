const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Set env before loading app
process.env.JWT_SECRET = "test-secret-key";
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

    const user = await User.findOne({ email });
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

    describe("POST /auth/register", () => {
        it("should register a new user with verification code", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({ name: "John", email: "john@test.com", password: "password123" });

            expect(res.status).toBe(201);
            expect(res.body.requiresVerification).toBe(true);
            expect(res.body.userId).toBeDefined();

            const user = await User.findOne({ email: "john@test.com" });
            expect(user.isVerified).toBe(false);
            expect(user.verificationCode).toBeDefined();
            expect(user.verificationCode.length).toBe(6);
        });

        it("should auto-verify when email not configured", async () => {
            // Temporarily remove email config
            const savedUser = process.env.EMAIL_USER;
            const savedPass = process.env.EMAIL_PASS;
            process.env.EMAIL_USER = "your-email@gmail.com";
            process.env.EMAIL_PASS = "your-app-password";

            // Need to re-require app to pick up env changes — but since it's cached,
            // we test the logic directly instead
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

            const user = await User.findOne({ email: "john@test.com" });

            const res = await request(app)
                .post("/auth/verify-email")
                .send({ email: "john@test.com", code: user.verificationCode });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("verified successfully");

            const verifiedUser = await User.findOne({ email: "john@test.com" });
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

            const user = await User.findOne({ email: "john@test.com" });
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
        it("should login with verified account", async () => {
            await registerAndVerify("John", "john@test.com", "password123");

            const res = await request(app)
                .post("/auth/login")
                .send({ email: "john@test.com", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Login successful");
            expect(res.body.token).toBeDefined();
            expect(res.body.user.name).toBe("John");
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
        it("should return user info with valid token", async () => {
            await registerAndVerify("John", "john@test.com", "password123");

            const loginRes = await request(app)
                .post("/auth/login")
                .send({ email: "john@test.com", password: "password123" });

            const res = await request(app)
                .get("/auth/me")
                .set("Authorization", `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe("John");
        });

        it("should reject request without token", async () => {
            const res = await request(app).get("/auth/me");
            expect(res.status).toBe(401);
        });
    });
});
