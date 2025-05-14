import request from "supertest";
import express, { Router } from "express";
import { LeaveRouter } from "./LeaveRouter";
import { LeaveController } from "../controllers/LeaveController";
import { StatusCodes } from "http-status-codes";
import { start } from "repl";
import { stat } from "fs";

const mockLeaveController = {
  delete: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
  ),
  getAll: jest.fn((req, res) => res.status(StatusCodes.OK).json([])),
  getById: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
  ),
  create: jest.fn((req, res) => res.status(StatusCodes.CREATED).json(req.body)),
  update: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
} as unknown as LeaveController;

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
const leaveRouter = new LeaveRouter(router, mockLeaveController);
app.use("/leave", leaveRouter.getRouter());

const BASE_LEAVES_URL = "/leave";
describe("LeaveRouter tests", () => {
  it("getAll on GET /leave can be called", async () => {
    // Act
    const response = await request(app)
      .get(BASE_LEAVES_URL)
      .expect(StatusCodes.OK);

    // Assert
    expect(mockLeaveController.getAll).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual([]);
  });

  it("getById route GET /leave/:id can be called", async () => {
    // Arrange
    const id = "1";
    const endPoint = `${BASE_LEAVES_URL}/${id}`;

    // Act
    const response = await request(app).get(endPoint);
    let requestedUrl = (mockLeaveController.getById as jest.Mock).mock
      .calls[0][0].originalUrl;

    // Assert
    expect(requestedUrl).toBeDefined();
    expect(requestedUrl).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);

    // should possibly be getting id from leavecontroller?
    expect(response.body).toEqual({ id });
  });

  it("Create route POST /leave can be called", async () => {
    // Arrange
    const newLeaveData = { startDate: "2023-01-01", endDate: "2023-01-10" };

    // Act
    const response = await request(app)
      .post(BASE_LEAVES_URL)
      .send(newLeaveData)
      .expect(StatusCodes.CREATED);

    let body = (mockLeaveController.create as jest.Mock).mock.calls[0][0].body;

    // Assert
    expect(body).toBeDefined();
    expect(mockLeaveController.create).toHaveBeenCalled();
    expect(body).toStrictEqual(newLeaveData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });

  it("Update route PATCH /leave can be called", async () => {
    // Arrange
    const updateLeaveData = { id: 1, status: "approved" };

    // Act
    const response = await request(app)
      .patch(BASE_LEAVES_URL)
      .send(updateLeaveData)
      .expect(StatusCodes.OK);
    let body = (mockLeaveController.update as jest.Mock).mock.calls[0][0].body;

    // Assert
    expect(body).toBeDefined();
    expect(body).toStrictEqual(updateLeaveData);
    expect(mockLeaveController.update).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
  });

  it("Delete route DELETE /leave/:id can be called", async () => {
    // Arrange
    const id = "1";
    const endPoint = `${BASE_LEAVES_URL}/1`;

    // Act
    const response = await request(app).delete(endPoint).expect(StatusCodes.OK);
    let url = (mockLeaveController.delete as jest.Mock).mock.calls[0][0]
      .originalUrl;

    // Assert
    expect(url).toBeDefined();
    expect(mockLeaveController.delete).toHaveBeenCalled();
    expect(url).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ id });
  });
});
