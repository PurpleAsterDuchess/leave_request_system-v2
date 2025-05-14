import request from "supertest";
import express, { Router } from "express";
import { UserRouter } from "./UserRouter";
import { UserController } from "@controllers/UserController";
import { StatusCodes } from "http-status-codes";

const mockUserController = {
  delete: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
  ),
  getAll: jest.fn((req, res) => res.status(StatusCodes.OK).json([])),
  getById: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
  ),
  getByEmail: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ email: req.params.emailAddress })
  ),
  create: jest.fn((req, res) => res.status(StatusCodes.CREATED).json(req.body)),
  update: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
} as unknown as UserController;

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
const userRouter = new UserRouter(router, mockUserController);
app.use("/users", userRouter.getRouter());

const BASE_USERS_URL = "/users";
describe("UserRouter tests", () => {
  it("getAll on GET /users can be called", async () => {
    // Act
    const response = await request(app)
      .get(BASE_USERS_URL)
      .expect(StatusCodes.OK);

    // Assert
    expect(mockUserController.getAll).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual([]);
  });

  it("getById route GET /users/:id can be called", async () => {
    // Arrange
    const id = "1";
    const endPoint = `${BASE_USERS_URL}/${id}`;

    // Act
    const response = await request(app).get(endPoint);
    let requestedUrl = (mockUserController.getById as jest.Mock).mock
      .calls[0][0].originalUrl;

    // Assert
    expect(requestedUrl).toBeDefined();
    expect(requestedUrl).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);

    // should possibly be getting id from usercontroller?
    expect(response.body).toEqual({ id });
  });

  it("Create route POST /users can be called", async () => {
    // Arrange
    const newUserData = {
      firstname: "test",
      surname: "test",
      password: "testpassword123",
      email: "test@email.com",
      roleId: 3,
      managerId: 10,
    };

    // Act
    const response = await request(app)
      .post(BASE_USERS_URL)
      .send(newUserData)
      .expect(StatusCodes.CREATED);

    let body = (mockUserController.create as jest.Mock).mock.calls[0][0].body;

    // Assert
    expect(body).toBeDefined();
    expect(mockUserController.create).toHaveBeenCalled();
    expect(body).toStrictEqual(newUserData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });

  it("Update route PATCH /users can be called", async () => {
    // Arrange
    const updateUserData = {
      id: 11,
      manager: 10,
    };

    // Act
    const response = await request(app)
      .patch(BASE_USERS_URL)
      .send(updateUserData)
      .expect(StatusCodes.OK);
    let body = (mockUserController.update as jest.Mock).mock.calls[0][0].body;

    // Assert
    expect(body).toBeDefined();
    expect(body).toStrictEqual(updateUserData);
    expect(mockUserController.update).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
  });

  it("Delete route DELETE /users/:id can be called", async () => {
    // Arrange
    const id = "1";
    const endPoint = `${BASE_USERS_URL}/1`;

    // Act
    const response = await request(app).delete(endPoint).expect(StatusCodes.OK);
    let url = (mockUserController.delete as jest.Mock).mock.calls[0][0]
      .originalUrl;

    // Assert
    expect(url).toBeDefined();
    expect(mockUserController.delete).toHaveBeenCalled();
    expect(url).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ id });
  });
});
