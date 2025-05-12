import { LeaveController } from "../controllers/LeaveController";
import { User } from "../entity/User";
import { Role } from "../entity/Role";
import { LeaveRequest } from "../entity/LeaveRequest";
import { DeleteResult, Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "../helper/ResponseHandler";
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

jest.mock("../helper/ResponseHandler");
jest.mock("class-validator", () => ({
  ...jest.requireActual("class-validator"),
  validate: jest.fn(),
}));
jest.mock("class-transformer", () => ({
  ...jest.requireActual("class-transformer"),
  instanceToPlain: jest.fn(),
}));

describe("LeaveController", () => {
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

  function getValidLeaveRequest(): LeaveRequest {
    let leaveRequest = new LeaveRequest();
    leaveRequest.startDate = "2000-01-01";
    leaveRequest.endDate = "2000-01-12";
    leaveRequest.reason = "test text";
    leaveRequest.user = getValidStaffData();
    return leaveRequest;
  }

  const mockRequest = (params = {}, body = {}): Partial<Request> => ({
    params,
    body,
  });
  const mockResponse = (): Partial<Response> => ({});

  let leaveController: LeaveController;
  let mockLeaveRepository: jest.Mocked<Repository<LeaveRequest>>;

  beforeEach(() => {
    mockLeaveRepository = mock<Repository<LeaveRequest>>();
    // Inject the mocked repository into UserController
    leaveController = new LeaveController();
    leaveController["leaveRepository"] =
      mockLeaveRepository as Repository<LeaveRequest>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAll returns NO_CONTENT if no leave requests exists", async () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    // Simulate no leave requests in the database
    mockLeaveRepository.find.mockResolvedValue([]);

    // Act
    await leaveController.getAll(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NO_CONTENT
    );
  });

  it("should return leave requests when user is admin", async () => {
    // Arrange
    let validLeaveRequest = getValidLeaveRequest();
    validLeaveRequest.user= getValidStaffData()

    const req = mockRequest();
    const res = mockResponse();

    req.signedInUser = getValidStaffData();

    (mockLeaveRepository.find as jest.Mock).mockResolvedValue(validLeaveRequest);

    // Act
    await leaveController.getAll(req as Request, res as Response);

    // Arrange
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.FORBIDDEN,
      LeaveController.ERROR_UNAUTHORIZED_ACTION
    );
  });

});
