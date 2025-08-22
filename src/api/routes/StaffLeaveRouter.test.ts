import request from "supertest";
import express, { Router } from "express";
import { StaffLeaveRouter } from "./StaffLeaveRouter";
import { StaffLeaveController } from "src/api/controllers/StaffLeaveController";
import { StatusCodes } from "http-status-codes";

const mockStaffLeaveController = {
  delete: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
  ),
  getAll: jest.fn((req, res) => res.status(StatusCodes.OK).json([])),
  getById: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
  ),
  create: jest.fn((req, res) => res.status(StatusCodes.CREATED).json(req.body)),
  update: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
} as unknown as StaffLeaveController;

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
const staffLeaveRouter = new StaffLeaveRouter(router, mockStaffLeaveController);
app.use("/leave/staff", staffLeaveRouter.getRouter());

const BASE_STAFF_LEAVE_URL = "/leave/staff";
describe("LeaveRouter tests", () => {
  it("getAll on GET /leave/staff can be called", async () => {
    // Act
    const response = await request(app)
      .get(BASE_STAFF_LEAVE_URL)
      .expect(StatusCodes.OK);

    // Assert
    expect(mockStaffLeaveController.getAll).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual([]);
  });

  it("getById route GET /leave/:id can be called", async () => {
    // Arrange
    const id = "1";
    const endPoint = `${BASE_STAFF_LEAVE_URL}/${id}`;

    // Act
    const response = await request(app).get(endPoint);
    let requestedUrl = (mockStaffLeaveController.getById as jest.Mock).mock
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
      .post(BASE_STAFF_LEAVE_URL)
      .send(newLeaveData)
      .expect(StatusCodes.CREATED);

    let body = (mockStaffLeaveController.create as jest.Mock).mock.calls[0][0]
      .body;

    // Assert
    expect(body).toBeDefined();
    expect(mockStaffLeaveController.create).toHaveBeenCalled();
    expect(body).toStrictEqual(newLeaveData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });

  it("Update route PATCH /leave can be called", async () => {
    // Arrange
    const updateLeaveData = { id: 1, status: "cancelled" };

    // Act
    const response = await request(app)
      .patch(BASE_STAFF_LEAVE_URL)
      .send(updateLeaveData)
      .expect(StatusCodes.OK);
    let body = (mockStaffLeaveController.update as jest.Mock).mock.calls[0][0]
      .body;

    // Assert
    expect(body).toBeDefined();
    expect(body).toStrictEqual(updateLeaveData);
    expect(mockStaffLeaveController.update).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
  });

  it("Delete route DELETE /leave/:id can be called", async () => {
    // Arrange
    const id = "1";
    const endPoint = `${BASE_STAFF_LEAVE_URL}/1`;

    // Act
    const response = await request(app).delete(endPoint).expect(StatusCodes.OK);
    let url = (mockStaffLeaveController.delete as jest.Mock).mock.calls[0][0]
      .originalUrl;

    // Assert
    expect(url).toBeDefined();
    expect(mockStaffLeaveController.delete).toHaveBeenCalled();
    expect(url).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ id });
  });
});
