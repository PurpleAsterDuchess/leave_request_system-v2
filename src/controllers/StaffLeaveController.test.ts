import { StaffLeaveController } from "@controllers/StaffLeaveController";
import { User } from "@entity/User";
import { Role } from "@entity/Role";
import { LeaveRequest } from "@entity/LeaveRequest";
import { DeleteResult, Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "@helper/ResponseHandler";
import { Request, Response } from "express";
import * as classValidator from "class-validator";
import * as classTransformer from "class-transformer";
import { mock } from "jest-mock-extended";

const VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS =
  "Password must be at least 10 characters long";
const VALIDATOR_CONSTRAINT_INVALID_EMAIL = "Must be a valid email address";
const VALIDATOR_CONSTRAINT_INVALID_ID = "User is required";
const ERROR_NO_ID_PROVIDED = "No ID provided";
const INVALID_USER_ID_NUMBER = "User with the provided ID not found";
const BLANK_USER_NAME = "";
const VALIDATOR_CONSTRAINT_EMPTY_OR_WHITESPACE =
  "Name cannot be empty or whitespace";
const VALIDATOR_CONSTRAINT_MAX_LENGTH_EXCEEDED =
  "Name must be 30 characters or less";

jest.mock("@helper/ResponseHandler");
jest.mock("class-validator", () => ({
  ...jest.requireActual("class-validator"),
  validate: jest.fn(),
}));
jest.mock("class-transformer", () => ({
  ...jest.requireActual("class-transformer"),
  instanceToPlain: jest.fn(),
}));

describe("StaffLeaveController", () => {
  function getValidAdminData(): User {
    let role = new Role();
    role.id = 1;
    role.name = "admin";
    let user = new User();
    user.id = 1;
    user.password = "a".repeat(10);
    user.email = "admin@email.com";
    user.role = role;
    return user;
  }

  function getValidStaffData(): User {
    let role = new Role();
    role.id = 3;
    role.name = "staff";
    let user = new User();
    user.id = 2;
    user.password = "b".repeat(10);
    user.email = "staff@email.com";
    user.role = role;
    return user;
  }

  function getValidLeaveRequest(): any {
    return {
      startDate: "2000-01-01",
      endDate: "2000-01-12",
      reason: "test text",
    };
  }

  const mockRequest = (params = {}, body = {}): Partial<Request> => ({
    params,
    body,
  });
  const mockResponse = (): Partial<Response> => ({});

  let leaveController: StaffLeaveController;
  let mockLeaveRepository: jest.Mocked<Repository<LeaveRequest>>;

  beforeEach(() => {
    mockLeaveRepository = {
      find: jest.fn(), // Mock the `find` method
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<LeaveRequest>>;

    leaveController = new StaffLeaveController();
    leaveController["leaveRepository"] =
      mockLeaveRepository as Repository<LeaveRequest>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAll returns only the signed-in staff's leave requests", async () => {
    const validStaff = getValidStaffData(); // Mock data for a staff user
    const validAdmin = getValidAdminData(); // Mock data for an admin user

    // Mock leave requests: one for the staff, one for the admin
    const validLeaveRequests = [
      {
        id: 1,
        user: { id: validStaff.id, email: validStaff.email }, // Plain object
        startDate: "2025-01-01",
        endDate: "2025-01-10",
      },
      {
        id: 2,
        user: { id: validAdmin.id, email: validAdmin.email }, // Plain object
        startDate: "2025-02-01",
        endDate: "2025-02-10",
      },
    ];

    const req = mockRequest();
    const res = mockResponse();

    // Simulate the signed-in user being the staff
    req.signedInUser = { id: validStaff.id };

    // Mock the repository to return only the leave requests for the signed-in staff
    (mockLeaveRepository.find as jest.Mock).mockResolvedValue(
      validLeaveRequests.filter((leave) => leave.user.id === validStaff.id)
    );

    // Act
    await leaveController.getAll(req as Request, res as Response);

    // Assert
    // Ensure the response only includes the leave requests for the signed-in staff
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(res, [
      {
        id: 1,
        user: validStaff,
        startDate: "2025-01-01",
        endDate: "2025-01-10",
      },
    ]);

    // Ensure the response does NOT include leave requests for other users
    expect(ResponseHandler.sendSuccessResponse).not.toHaveBeenCalledWith(
      res,
      expect.arrayContaining([
        {
          id: 2,
          user: validAdmin,
          startDate: "2025-02-01",
          endDate: "2025-02-10",
        },
      ])
    );
  });
});
