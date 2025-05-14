import request from "supertest";
import express, { Router } from "express";
import { LoginRouter } from "./LoginRouter";
import { LoginController } from "../controllers/LoginController";
import { StatusCodes } from "http-status-codes";

const mockLoginController = {
  login: jest.fn((req, res) => res.status(StatusCodes.CREATED).json(req.body)),
} as unknown as LoginController;

const router = Router();
jest.spyOn(router, "get");
jest.spyOn(router, "post");
jest.spyOn(router, "patch");
jest.spyOn(router, "delete");
jest.spyOn(router, "use");

const app = express();
const helmet = require("helmet");
app.use(helmet());
app.use(express.json());
const userRouter = new LoginRouter(router, mockLoginController);
app.use("/users", userRouter.getRouter());

const BASE_USERS_URL = "/users";
describe("LoginRouter tests", () => {
  it("Create route POST /users can be called", async () => {
    // Arrange
    const newLoginData = {
      firstname: "test",
      surname: "test",
      password: "test",
      email: "test@email.com",
    };

    // Act
    const response = await request(app)
      .post(BASE_USERS_URL)
      .send(newLoginData)
      .expect(StatusCodes.CREATED);

    let body = (mockLoginController.login as jest.Mock).mock.calls[0][0].body;

    // Assert
    expect(body).toBeDefined();
    expect(mockLoginController.login).toHaveBeenCalled();
    expect(body).toStrictEqual(newLoginData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });
});
