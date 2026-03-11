const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test-secret-key";

const app = require("../app");
const Property = require("../models/Property");

let mongoServer;
let authToken;
const testUserId = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Generate a test JWT token
    authToken = jwt.sign(
        { id: testUserId, email: "test@test.com", name: "Test User" },
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
    await Property.deleteMany({});
});

describe("Property Service", () => {

    describe("GET /properties", () => {
        it("should return empty array when no properties", async () => {
            const res = await request(app).get("/properties");
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("should return all properties", async () => {
            await Property.create({
                addressLine1: "10 Test St", city: "London",
                postcode: "SW1A 1AA", imageKey: "test.jpg", createdBy: testUserId
            });

            const res = await request(app).get("/properties");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].addressLine1).toBe("10 Test St");
        });

        it("should filter by postcode", async () => {
            await Property.create([
                { addressLine1: "A", city: "London", postcode: "SW1A 1AA", imageKey: "a.jpg", createdBy: testUserId },
                { addressLine1: "B", city: "Manchester", postcode: "M1 1AA", imageKey: "b.jpg", createdBy: testUserId },
            ]);

            const res = await request(app).get("/properties?postcode=SW1A");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].postcode).toBe("SW1A 1AA");
        });

        it("should filter by city", async () => {
            await Property.create([
                { addressLine1: "A", city: "London", postcode: "SW1A 1AA", imageKey: "a.jpg", createdBy: testUserId },
                { addressLine1: "B", city: "Manchester", postcode: "M1 1AA", imageKey: "b.jpg", createdBy: testUserId },
            ]);

            const res = await request(app).get("/properties?city=London");
            expect(res.body.length).toBe(1);
        });

        it("should filter by price range", async () => {
            await Property.create([
                { addressLine1: "A", city: "London", postcode: "SW1A 1AA", imageKey: "a.jpg", price: 500, createdBy: testUserId },
                { addressLine1: "B", city: "London", postcode: "SW1B 1AA", imageKey: "b.jpg", price: 1500, createdBy: testUserId },
            ]);

            const res = await request(app).get("/properties?minPrice=400&maxPrice=600");
            expect(res.body.length).toBe(1);
            expect(res.body[0].price).toBe(500);
        });
    });

    describe("POST /properties/add", () => {
        it("should add a property with valid token", async () => {
            const res = await request(app)
                .post("/properties/add")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    addressLine1: "10 Test St", city: "London",
                    postcode: "SW1A 1AA", imageKey: "test.jpg"
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Property added successfully");
            expect(res.body.property.createdBy).toBe(testUserId);
        });

        it("should reject without auth token", async () => {
            const res = await request(app)
                .post("/properties/add")
                .send({
                    addressLine1: "10 Test St", city: "London",
                    postcode: "SW1A 1AA", imageKey: "test.jpg"
                });

            expect(res.status).toBe(401);
        });

        it("should reject missing required fields", async () => {
            const res = await request(app)
                .post("/properties/add")
                .set("Authorization", `Bearer ${authToken}`)
                .send({ addressLine1: "10 Test St" });

            expect(res.status).toBe(400);
        });
    });

    describe("GET /properties/:id", () => {
        it("should return a single property", async () => {
            const prop = await Property.create({
                addressLine1: "10 Test St", city: "London",
                postcode: "SW1A 1AA", imageKey: "test.jpg", createdBy: testUserId
            });

            const res = await request(app).get(`/properties/${prop._id}`);
            expect(res.status).toBe(200);
            expect(res.body.addressLine1).toBe("10 Test St");
        });

        it("should return 404 for non-existent property", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/properties/${fakeId}`);
            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /properties/:id", () => {
        it("should delete own property", async () => {
            const prop = await Property.create({
                addressLine1: "10 Test St", city: "London",
                postcode: "SW1A 1AA", imageKey: "test.jpg", createdBy: testUserId
            });

            const res = await request(app)
                .delete(`/properties/${prop._id}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Property deleted successfully");
        });

        it("should reject deleting another user's property", async () => {
            const prop = await Property.create({
                addressLine1: "10 Test St", city: "London",
                postcode: "SW1A 1AA", imageKey: "test.jpg", createdBy: "other-user-id"
            });

            const res = await request(app)
                .delete(`/properties/${prop._id}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(403);
        });
    });
});
