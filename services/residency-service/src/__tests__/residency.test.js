const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test-secret-key";
process.env.NODE_ENV = "test";

const app = require("../app");
const Residency = require("../models/Residency");
const ContactRequest = require("../models/ContactRequest");

let mongoServer;
let authToken;
let otherToken;
let adminToken;
const testUserId = new mongoose.Types.ObjectId().toString();
const otherUserId = new mongoose.Types.ObjectId().toString();
const adminUserId = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    authToken = jwt.sign(
        { id: testUserId, email: "test@test.com", name: "Test User", role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    otherToken = jwt.sign(
        { id: otherUserId, email: "other@test.com", name: "Other User", role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
        { id: adminUserId, email: "admin@test.com", name: "Admin User", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    await Residency.deleteMany({});
    await ContactRequest.deleteMany({});
});

describe("Residency Service", () => {

    describe("POST /residencies", () => {
        it("should add a residency with pending status", async () => {
            const res = await request(app)
                .post("/residencies")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ propertyId: "prop123", fromYear: "2020", toYear: "2023" });

            expect(res.status).toBe(200);
            expect(res.body.residency.status).toBe("pending");
            expect(res.body.residency.userName).toBe("Test User");
        });

        it("should reject without auth", async () => {
            const res = await request(app)
                .post("/residencies")
                .send({ propertyId: "prop123", fromYear: "2020" });

            expect(res.status).toBe(401);
        });

        it("should reject missing fields", async () => {
            const res = await request(app)
                .post("/residencies")
                .set("Authorization", `Bearer ${authToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it("should default toYear to Present", async () => {
            const res = await request(app)
                .post("/residencies")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ propertyId: "prop123", fromYear: "2022" });

            expect(res.body.residency.toYear).toBe("Present");
        });
    });

    describe("GET /properties/:id/residents", () => {
        it("should return residents for a property", async () => {
            await Residency.create({
                userId: testUserId, userName: "Test User",
                propertyId: "prop123", fromYear: "2020", toYear: "2023"
            });

            const res = await request(app).get("/properties/prop123/residents");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].userName).toBe("Test User");
        });

        it("should return empty array for property with no residents", async () => {
            const res = await request(app).get("/properties/unknown/residents");
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("POST /residencies/:id/report", () => {
        it("should report a residency", async () => {
            const residency = await Residency.create({
                userId: otherUserId, userName: "Other User",
                propertyId: "prop123", fromYear: "2020",
            });

            const res = await request(app)
                .post(`/residencies/${residency._id}/report`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ reason: "This person never lived here" });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("reported");
        });

        it("should prevent duplicate reports from same user", async () => {
            const residency = await Residency.create({
                userId: otherUserId, userName: "Other User",
                propertyId: "prop123", fromYear: "2020",
            });

            await request(app)
                .post(`/residencies/${residency._id}/report`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ reason: "Fake" });

            const res = await request(app)
                .post(`/residencies/${residency._id}/report`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ reason: "Still fake" });

            expect(res.status).toBe(409);
        });
    });

    describe("Admin endpoints", () => {
        it("should get pending residencies as admin", async () => {
            await Residency.create({
                userId: testUserId, userName: "Test User",
                propertyId: "prop123", fromYear: "2020", status: "pending",
            });

            const res = await request(app)
                .get("/admin/residencies/pending")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });

        it("should reject non-admin from pending endpoint", async () => {
            const res = await request(app)
                .get("/admin/residencies/pending")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(403);
        });

        it("should verify a residency as admin", async () => {
            const residency = await Residency.create({
                userId: testUserId, userName: "Test User",
                propertyId: "prop123", fromYear: "2020", status: "pending",
            });

            const res = await request(app)
                .patch(`/admin/residencies/${residency._id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ status: "verified" });

            expect(res.status).toBe(200);
            expect(res.body.residency.status).toBe("verified");
        });

        it("should reject a residency as admin", async () => {
            const residency = await Residency.create({
                userId: testUserId, userName: "Test User",
                propertyId: "prop123", fromYear: "2020", status: "pending",
            });

            const res = await request(app)
                .patch(`/admin/residencies/${residency._id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ status: "rejected" });

            expect(res.status).toBe(200);
            expect(res.body.residency.status).toBe("rejected");
        });

        it("should get reported residencies as admin", async () => {
            await Residency.create({
                userId: testUserId, userName: "Test User",
                propertyId: "prop123", fromYear: "2020",
                reports: [{ reportedBy: otherUserId, reason: "Fake" }],
            });

            const res = await request(app)
                .get("/admin/residencies/reported")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].reports.length).toBe(1);
        });
    });

    describe("POST /contact-request", () => {
        it("should send a contact request", async () => {
            const res = await request(app)
                .post("/contact-request")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ toUserId: otherUserId, propertyId: "prop123" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Contact request sent successfully");
        });

        it("should prevent duplicate pending requests", async () => {
            await request(app)
                .post("/contact-request")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ toUserId: otherUserId, propertyId: "prop123" });

            const res = await request(app)
                .post("/contact-request")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ toUserId: otherUserId, propertyId: "prop123" });

            expect(res.status).toBe(409);
        });

        it("should prevent self-contact", async () => {
            const res = await request(app)
                .post("/contact-request")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ toUserId: testUserId, propertyId: "prop123" });

            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /contact-requests/:requestId", () => {
        it("should accept a request as recipient", async () => {
            const cr = await ContactRequest.create({
                fromUserId: testUserId, fromUserName: "Test",
                fromUserEmail: "test@test.com", toUserId: otherUserId,
                propertyId: "prop123",
            });

            const res = await request(app)
                .patch(`/contact-requests/${cr._id}`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ status: "accepted" });

            expect(res.status).toBe(200);
            expect(res.body.request.status).toBe("accepted");
        });

        it("should reject update by non-recipient", async () => {
            const cr = await ContactRequest.create({
                fromUserId: testUserId, fromUserName: "Test",
                fromUserEmail: "test@test.com", toUserId: otherUserId,
                propertyId: "prop123",
            });

            const res = await request(app)
                .patch(`/contact-requests/${cr._id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ status: "accepted" });

            expect(res.status).toBe(403);
        });
    });
});
