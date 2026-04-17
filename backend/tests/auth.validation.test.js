const request = require("supertest");
const app = require("../src/app");

describe("Auth validations", () => {
  it("rejects invalid signup payload", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "",
      email: "not-an-email",
      password: "123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
