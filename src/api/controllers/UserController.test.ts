import { UserController } from "./UserController";
import { User } from "../entity/User";
import { Role } from "../entity/Role";
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

describe("UserController", () => {
  function getValidManagerData(): User {
    let role = new Role();
    role.id = 2;
    role.name = "manager";
    let user = new User();
    user.id = 1;
    user.password = "a".repeat(10);
    user.email = "manager@email.com";
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
    user.manager = getValidManagerData();
    return user;
  }

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

  const mockRequest = (params = {}, body = {}): Partial<Request> => ({
    params,
    body,
  });
  const mockResponse = (): Partial<Response> => ({});

  const mockQueryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  } as any;

  let userController: UserController;
  let mockUserRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockUserRepository = mock<Repository<User>>();
    mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    // Inject the mocked repository into UserController
    userController = new UserController();
    userController["userRepository"] = mockUserRepository as Repository<User>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAll returns NO_CONTENT if no users exist", async () => {
    // Arrange
    const req = mockRequest();
    req.signedInUser = getValidAdminData();
    const res = mockResponse();
    //Simulate no users in the database
    mockUserRepository.find.mockResolvedValue([]);

    // Act
    await userController.getAll(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NO_CONTENT
    );
  });

  it("getAll returns INTERNAL_SERVER_ERROR if server fails to retrieve users", async () => {
    // Arrange
    const req = mockRequest();
    req.signedInUser = getValidAdminData();
    const res = mockResponse();
    mockUserRepository.find.mockRejectedValue(
      new Error("Database connection error")
    );

    // Act, Assert
    await expect(
      userController.getAll(req as Request, res as Response)
    ).rejects.toThrow("Database connection error");
  });

  it("getAll will return all users when called with admin", async () => {
    // Arrange
    const mockUsers: User[] = [getValidManagerData(), getValidStaffData()];
    const req = mockRequest();
    req.signedInUser = getValidAdminData();
    const res = mockResponse();
    mockUserRepository.find.mockResolvedValue(mockUsers);

    // Act
    await userController.getAll(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: expect.arrayContaining(["role", "manager"]),
      })
    );

    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      mockUsers
    );
  });

  it("create will return BAD_REQUEST if no user password was provided", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      { email: validManagerDetails.email, roleId: validManagerDetails.role.id }
    );
    const res = mockResponse();
    //controller validate returns Password must be at least 10 characters long
    const EXPECTED_ERROR_MESSAGE =
      VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS;
    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "password",
        constraints: {
          //IsString: VALIDATOR_CONSTRAINT_PASSWORD_MUST_BE_A_STRING,
          MinLength: VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS,
        },
      },
    ]);

    // Act, Assert
    await expect(
      userController.create(req as Request, res as Response)
    ).rejects.toThrow(EXPECTED_ERROR_MESSAGE);
  });

  it("create will return BAD_REQUEST if no user email was provided", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        roleId: validManagerDetails.role.id,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_INVALID_EMAIL;

    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "email",
        constraints: {
          IsEmail: VALIDATOR_CONSTRAINT_INVALID_EMAIL,
        },
      },
    ]);

    // Act, Assert
    await expect(
      userController.create(req as Request, res as Response)
    ).rejects.toThrow(EXPECTED_ERROR_MESSAGE);
  });

  it("create will return BAD_REQUEST if no user id was provided", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        email: validManagerDetails.email,
        password: validManagerDetails.password,
      }
    );
    const res = mockResponse();
    //controller validate returns Password must be at least 10 characters long
    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_INVALID_ID;
    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "role",
        constraints: {
          //IsString: VALIDATOR_CONSTRAINT_PASSWORD_MUST_BE_A_STRING,
          IsNotEmpty: VALIDATOR_CONSTRAINT_INVALID_ID,
        },
      },
    ]);

    // Act,  Assert
    await expect(
      userController.create(req as Request, res as Response)
    ).rejects.toThrow(EXPECTED_ERROR_MESSAGE);
  });

  it("create will return a valid user and return CREATED status when supplied with valid details", async () => {
    // Arrange
    const validAdminDetails = getValidAdminData();
    const req = mockRequest(
      {},
      {
        password: validAdminDetails.password,
        email: validAdminDetails.email,
        roleId: validAdminDetails.role.id,
      }
    );

    req.signedInUser = validAdminDetails;

    const res = mockResponse();
    mockUserRepository.save.mockResolvedValue(validAdminDetails);
    jest.spyOn(classTransformer, "instanceToPlain").mockReturnValue({
      id: validAdminDetails.id,
      email: validAdminDetails.email,
      role: {
        id: validAdminDetails.role.id,
        name: validAdminDetails.role.name,
      },
    } as any);
    jest.spyOn(classValidator, "validate").mockResolvedValue([]);

    // Act
    await userController.create(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: validAdminDetails.password,
        email: validAdminDetails.email,
        role: validAdminDetails.role.id,
      })
    );
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      //instanceToPlain should remove password (even if we didn't use a spy)
      {
        id: validAdminDetails.id,
        email: validAdminDetails.email,
        role: validAdminDetails.role,
      },
      StatusCodes.CREATED
    );
  });

  it("create will return an UNAUTHORIZED when signedInUser is not admin", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData(); // Simulate a non-admin user
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        roleId: validManagerDetails.role.id,
      }
    );

    req.signedInUser = validManagerDetails; // Signed-in user is a manager, not an admin

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(classValidator, "validate").mockResolvedValue([]); // No validation errors

    // Act
    await userController.create(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.UNAUTHORIZED,
      "Invalid authorization for this action"
    );
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it("delete will return NOT_FOUND if no id is provided", async () => {
    // Arrange
    const req = mockRequest(); //Empty request = no param for id
    const res = mockResponse();

    req.signedInUser = getValidAdminData();

    // Act,  Assert
    await expect(
      userController.delete(req as Request, res as Response)
    ).rejects.toThrow(ERROR_NO_ID_PROVIDED);
  });

  it("delete will return NOT_FOUND if the user id does not exist", async () => {
    // Arrange
    const req = mockRequest({ id: INVALID_USER_ID_NUMBER });
    const res = mockResponse();
    req.signedInUser = getValidAdminData();

    //Simulate that no role was deleted
    const deleteResult: DeleteResult = { affected: 0 } as DeleteResult;
    mockUserRepository.delete.mockResolvedValue(deleteResult);

    // Act + Assert
    await expect(
      userController.delete(req as Request, res as Response)
    ).rejects.toThrow(INVALID_USER_ID_NUMBER);
  });

  it("delete will return SUCCESS if the role is successfully deleted", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest({ id: validManagerDetails.id }); //id that exists
    const res = mockResponse();
    req.signedInUser = getValidAdminData();

    //Simulate a deletion
    const deleteResult: DeleteResult = { affected: 1 } as DeleteResult;
    mockUserRepository.delete.mockResolvedValue(deleteResult);

    // Act
    await userController.delete(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.delete).toHaveBeenCalledWith(
      validManagerDetails.id
    );
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      "User deleted",
      StatusCodes.OK
    );
  });

  it("delete will return UNAUTHORIZED if the role is not admin", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData(); // Simulate a non-admin user
    const req = mockRequest({ id: validManagerDetails.id }); // ID that exists
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    req.signedInUser = validManagerDetails; // Signed-in user is a manager, not an admin

    // Act
    await userController.delete(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.delete).not.toHaveBeenCalled();
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.UNAUTHORIZED,
      "Invalid authorization for this action"
    );
  });

  it("update returns a BAD_REQUEST if no id is provided", async () => {
    // Arrange
    const req = mockRequest({}, {}); //Invalid/no id
    const res = mockResponse();

    req.signedInUser = getValidAdminData();

    // Act + Assert
    await expect(
      userController.update(req as Request, res as Response)
    ).rejects.toThrow(ERROR_NO_ID_PROVIDED);
  });

  it("update will return a BAD_REQUEST if the name does not exist/blank", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      { id: validManagerDetails.id, name: BLANK_USER_NAME }
    );
    const res = mockResponse();
    req.signedInUser = getValidAdminData();

    mockUserRepository.createQueryBuilder.mockReturnValue({
      ...mockQueryBuilder,
      getOne: jest.fn(() => ({
        id: validManagerDetails.id,
        name: BLANK_USER_NAME,
      })),
    });
    mockUserRepository.findOne.mockResolvedValue(validManagerDetails);

    const EXPECTED_ERROR_MESSAGE = `${VALIDATOR_CONSTRAINT_INVALID_ID}, ${VALIDATOR_CONSTRAINT_EMPTY_OR_WHITESPACE}, ${VALIDATOR_CONSTRAINT_MAX_LENGTH_EXCEEDED}`;

    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "name",
        constraints: {
          isNotEmpty: VALIDATOR_CONSTRAINT_INVALID_ID,
          Matches: VALIDATOR_CONSTRAINT_EMPTY_OR_WHITESPACE,
          MaxLength: VALIDATOR_CONSTRAINT_MAX_LENGTH_EXCEEDED,
        },
      },
    ]);

    // Act + Assert
    await expect(
      userController.update(req as Request, res as Response)
    ).rejects.toThrow(EXPECTED_ERROR_MESSAGE);
  });

  it("update will return a SUCCESS if the user is updated", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const updatedUser = {
      id: validManagerDetails.id,
      firstname: "Updated Firstname",
      surname: "Updated Surname",
      email: "updated@example.com",
      role: validManagerDetails.role,
      manager: validManagerDetails.manager,
      initialAlTotal: 20,
      remainingAl: 15,
      password: "hashedPassword",
      salt: "randomSalt",
      hashPassword: jest.fn(),
      setDefaultAlTotal: jest.fn(),
    };
    const req = mockRequest({}, validManagerDetails);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    req.signedInUser = getValidAdminData();

    // Ensure validate is mocked to return an empty array
    jest.spyOn(classValidator, "validate").mockResolvedValue([]);

    // Ensure the user object passed to validate is complete
    mockUserRepository.createQueryBuilder.mockReturnValue({
      ...mockQueryBuilder,
      getOne: jest.fn(() => ({
        id: validManagerDetails.id,
        firstname: "Updated Firstname",
        surname: "Updated Surname",
        email: "updated@example.com",
        role: validManagerDetails.role,
        manager: validManagerDetails.manager,
        initialAlTotal: 20,
        remainingAl: 15,
        password: "hashedPassword",
        salt: "randomSalt",
        hashPassword: jest.fn(),
        setDefaultAlTotal: jest.fn(),
      })),
    });

    mockUserRepository.save.mockResolvedValue(updatedUser);

    // Act
    await userController.update(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: validManagerDetails.id,
        firstname: "Updated Firstname",
        surname: "Updated Surname",
      })
    );
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      updatedUser,
      StatusCodes.OK
    );
  });

  it("update will return an UNAUTHORIZED when signedInUser is not admin", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const updatedUser = {
      id: validManagerDetails.id,
      firstname: "Updated Firstname",
      surname: "Updated Surname",
      email: "updated@example.com",
      role: validManagerDetails.role,
      manager: validManagerDetails.manager,
      initialAlTotal: 20,
      remainingAl: 15,
      password: "hashedPassword",
      salt: "randomSalt",
      hashPassword: jest.fn(),
      setDefaultAlTotal: jest.fn(),
    };
    const req = mockRequest({}, validManagerDetails);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    req.signedInUser = getValidStaffData();

    // Ensure validate is mocked to return an empty array
    jest.spyOn(classValidator, "validate").mockResolvedValue([]);

    // Ensure the user object passed to validate is complete
    mockUserRepository.createQueryBuilder.mockReturnValue({
      ...mockQueryBuilder,
      getOne: jest.fn(() => ({
        id: validManagerDetails.id,
        firstname: "Updated Firstname",
        surname: "Updated Surname",
        email: "updated@example.com",
        role: validManagerDetails.role,
        manager: validManagerDetails.manager,
        initialAlTotal: 20,
        remainingAl: 15,
        password: "hashedPassword",
        salt: "randomSalt",
        hashPassword: jest.fn(),
        setDefaultAlTotal: jest.fn(),
      })),
    });

    mockUserRepository.save.mockResolvedValue(updatedUser);

    // Act
    await userController.update(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.save).not.toHaveBeenCalledWith(
      expect.objectContaining({
        id: validManagerDetails.id,
        firstname: "Updated Firstname",
        surname: "Updated Surname",
      })
    );
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.UNAUTHORIZED,
      "Invalid authorization for this action"
    );
  });
});
