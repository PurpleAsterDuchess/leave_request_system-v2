import { LeaveController } from "../controllers/LeaveController";
import { User } from "../entity/User";
import { Role } from "../entity/Role";
import { LeaveRequest } from "../entity/LeaveRequest";
import { DeleteResult, Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "../helper/ResponseHandler";
import { Request, Response } from "express";
import { mock } from "jest-mock-extended";

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

    const validAdmin = getValidAdminData()
    req.signedInUser = validAdmin;


    // Simulate no leave requests in the database
    mockLeaveRepository.find.mockResolvedValue([]);

    // Act
    await leaveController.getAll(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NO_CONTENT,
      "No leave requests found."
    );
  });

  it("getAll returns leave requests when user is admin", async () => {
    // Arrange
    const validAdmin = getValidAdminData();
    const validLeaveRequests = [
      {
        id: 1,
        user: validAdmin,
        startDate: "2025-01-01",
        endDate: "2025-01-10",
      },
      {
        id: 2,
        user: getValidStaffData(),
        startDate: "2025-02-01",
        endDate: "2025-02-10",
      },
    ];

    const req = mockRequest();
    const res = mockResponse();

    req.signedInUser = validAdmin;

    (mockLeaveRepository.find as jest.Mock).mockResolvedValue(
      validLeaveRequests
    );

    // Act
    await leaveController.getAll(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      expect.arrayContaining(validLeaveRequests),
      StatusCodes.OK
    );
  });

  it("getById returns only the signed-in staff's leave requests", async () => {
    const validStaff = getValidStaffData(); // Mock data for a staff user
    const validAdmin = getValidAdminData(); // Mock data for an admin user

    // Mock leave requests: one for the staff, one for the admin
    const validLeaveRequests = [
      {
        id: 1,
        user: validStaff,
        startDate: "2025-01-01",
        endDate: "2025-01-10",
      },
      {
        id: 2,
        user: validAdmin,
        startDate: "2025-02-01",
        endDate: "2025-02-10",
      },
    ];

    const req = mockRequest();
    const res = mockResponse();

    // Simulate the signed-in user being the staff
    req.signedInUser = validStaff;

    // Mock the repository to return all leave requests
    (mockLeaveRepository.find as jest.Mock).mockResolvedValue(
      validLeaveRequests.filter((leave) => leave.user.id === validStaff.id)
    );

    // Act
    await leaveController.getById(req as Request, res as Response);

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
