import { StaffLeaveController } from "./StaffLeaveController";
import { User } from "../entity/User";
import { Role } from "../entity/Role";
import { LeaveRequest } from "../entity/LeaveRequest";
import { DeleteResult, Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "../helper/ResponseHandler";
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import * as classValidator from "class-validator";

jest.mock("../helper/ResponseHandler");
jest.mock("class-validator", () => ({
  ...jest.requireActual("class-validator"),
  validate: jest.fn(),
}));
jest.mock("class-transformer", () => ({
  ...jest.requireActual("class-transformer"),
  instanceToPlain: jest.fn(),
}));
jest.mock("../data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
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
      leaveId: 1,
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
  let mockUserRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockLeaveRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<LeaveRequest>>;

    mockUserRepository = {
      findOneByOrFail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === LeaveRequest) {
        return mockLeaveRepository;
      } else if (entity === User) {
        return mockUserRepository;
      }
      return null;
    });

    leaveController = new StaffLeaveController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAll returns only the signed-in staff's leave requests", async () => {
    const validStaff = getValidStaffData();
    const validAdmin = getValidAdminData();

    const validLeaveRequests = [
      {
        leaveId: 1,
        user: validStaff,
        startDate: "2025-01-01",
        endDate: "2025-01-10",
      },
      {
        leaveId: 2,
        user: validAdmin,
        startDate: "2025-02-01",
        endDate: "2025-02-10",
      },
    ] as LeaveRequest[];

    const staffLeaveRequests = validLeaveRequests.filter(
      (leave) => leave.user.id === validStaff.id
    );

    const req = mockRequest();
    const res = mockResponse();

    // Simulate the signed-in user being the staff
    req.signedInUser = { uid: validStaff.id };

    mockLeaveRepository.find.mockResolvedValue(staffLeaveRequests);

    // Act
    await leaveController.getAll(req as Request, res as Response);

    // Assert
    expect(mockLeaveRepository.find).toHaveBeenCalledWith({
      where: { user: { id: validStaff.id } },
      relations: ["user"],
    });

    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      staffLeaveRequests
    );

    // Ensure the response does NOT include leave requests for other users
    expect(ResponseHandler.sendSuccessResponse).not.toHaveBeenCalledWith(
      res,
      expect.arrayContaining([
        expect.objectContaining({
          leaveId: 2,
          user: validAdmin,
        }),
      ])
    );
  });

  it("getById returns an error if an invalid id is supplied", async () => {
    // Arrange
    const req = mockRequest({ id: "abc" });
    const res = mockResponse();

    // Act
    await leaveController.getById(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid ID format"
    );
  });

  it("getById returns NOT_FOUND if the leave id does not exist", async () => {
    // Arrange
    const req = mockRequest({ id: "abc" });
    const res = mockResponse();

    // Act
    await leaveController.getById(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid ID format"
    );
  });

  it("getById returns a leave request if a valid id is supplied", async () => {
    // Arrange
    const validAdminDetails = getValidAdminData();
    const validLeaveRequest = getValidLeaveRequest();
    validLeaveRequest.user = validAdminDetails;
    const req = mockRequest({ id: validLeaveRequest.leaveId });
    const res = mockResponse();
    mockLeaveRepository.findOne.mockResolvedValue(validLeaveRequest);

    // Act
    await leaveController.getById(req as Request, res as Response);

    // Assert
    expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
      where: { leaveId: validLeaveRequest.leaveId },
    });
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      validLeaveRequest
    );
  });

  it("update returns an error if the leave id does not exist", async () => {
    // Arrange
    const req = mockRequest({ id: 12 });
    const res = mockResponse();

    // Act
    await leaveController.update(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NOT_FOUND,
      "Failed to retrieve leave request"
    );
  });

  it("update returns an error if there is no change", async () => {
    // Arrange
    const validAdminDetails = getValidAdminData();
    validAdminDetails.remainingAl = 10;
    const validLeaveRequest = getValidLeaveRequest();
    validLeaveRequest.user = validAdminDetails;

    const req = mockRequest({}, validLeaveRequest);
    const res = mockResponse();

    mockLeaveRepository.findOneByOrFail.mockResolvedValue(validLeaveRequest);

    // Act
    await leaveController.update(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NOT_MODIFIED,
      "No changes made to the leave request"
    );
  });

  it("update returns SUCCESS if there is a valid change", async () => {
    // Arrange
    const validStaffDetails = getValidStaffData();
    validStaffDetails.remainingAl = 10;
    const validLeaveRequest = getValidLeaveRequest();
    validLeaveRequest.user = validStaffDetails;

    const updatedStartDate = "2000-01-05";
    const updatedEndDate = "2000-01-15";

    const req = mockRequest(
      {},
      {
        id: validLeaveRequest.leaveId,
        startDate: updatedStartDate,
        endDate: updatedEndDate,
      }
    );

    const res = mockResponse();

    mockLeaveRepository.findOneByOrFail.mockResolvedValue(validLeaveRequest);
    mockLeaveRepository.save.mockResolvedValue({
      ...validLeaveRequest,
      startDate: updatedStartDate,
      endDate: updatedEndDate,
    });
    mockUserRepository.findOneByOrFail.mockResolvedValue(validStaffDetails);
    mockUserRepository.save.mockResolvedValue(validStaffDetails);

    // Act
    await leaveController.update(req as Request, res as Response);

    // Assert
    expect(mockLeaveRepository.findOneByOrFail).toHaveBeenCalledWith({
      leaveId: validLeaveRequest.leaveId,
    });
    expect(mockLeaveRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: updatedStartDate,
        endDate: updatedEndDate,
      })
    );
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      expect.objectContaining({
        startDate: updatedStartDate,
        endDate: updatedEndDate,
      }),
      StatusCodes.OK
    );
  });

  it("delete returns SUCCESS if a valid leave id is supplied", async () => {
    // Arrange
    const validStaffDetails = getValidStaffData();
    validStaffDetails.remainingAl = 10;
    const validLeaveRequest = getValidLeaveRequest();
    validLeaveRequest.user = validStaffDetails;

    const req = mockRequest({ id: validLeaveRequest.leaveId });
    const res = mockResponse();

    // signedInUser should be an object with a uid property
    req.signedInUser = { uid: validStaffDetails.id };

    // Mock the repository to return the leave request
    mockLeaveRepository.findOneOrFail = jest
      .fn()
      .mockResolvedValue(validLeaveRequest);
    mockUserRepository.save.mockResolvedValue(validStaffDetails);
    const deleteResult: DeleteResult = { affected: 1, raw: {} } as DeleteResult;
    mockLeaveRepository.delete.mockResolvedValue(deleteResult);

    // Act
    await leaveController.delete(req as Request, res as Response);

    // Assert
    expect(mockLeaveRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { leaveId: validLeaveRequest.leaveId },
      relations: ["user"],
    });
    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: validStaffDetails.id })
    );
    expect(mockLeaveRepository.delete).toHaveBeenCalledWith(
      validLeaveRequest.leaveId
    );
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      "Leave request deleted",
      StatusCodes.OK
    );
  });
});
