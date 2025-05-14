import { validate } from "class-validator";
import { User } from "./User";
import { LeaveRequest } from "./LeaveRequest";

describe("LeaveRequest Entity", () => {
  function getValidUser(): User {
    const user = new User();
    user.id = 1;
    user.firstname = "test";
    user.surname = "test";
    user.email = "test@email.com";
    user.password = "a".repeat(10);
    user.role = { id: 1, name: "admin" } as any; // Assuming `role` is an object
    user.manager = null;
    return user;
  }

  function getValidLeaveRequest(): LeaveRequest {
    const leaveRequest = new LeaveRequest();
    leaveRequest.leaveId = 1;
    leaveRequest.user = getValidUser();
    leaveRequest.createdAt = new Date();
    leaveRequest.updatedAt = new Date();
    leaveRequest.startDate = "2023-10-01";
    leaveRequest.endDate = "2023-10-10";
    leaveRequest.reason = null;
    leaveRequest.status = "pending";
    leaveRequest.type = "Annual Leave";
    return leaveRequest;
  }

  it("a leave request without a user is considered invalid", async () => {
    // Arrange
    const invalidLeaveRequest = getValidLeaveRequest();
    invalidLeaveRequest.user = null;

    // Act
    const errors = await validate(invalidLeaveRequest);
    console.log("Validation errors:", errors);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty("isNotEmpty");
  });

  it("a leave request with invalid startDate is considered invalid", async () => {
    // Arrange
    const invalidLeaveRequest = getValidLeaveRequest();
    invalidLeaveRequest.startDate = "invalid-date";

    // Act
    const errors = await validate(invalidLeaveRequest);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty("isDateString");
  });

  it("a leave request with invalid endDate is considered invalid", async () => {
    // Arrange
    const invalidLeaveRequest = getValidLeaveRequest();
    invalidLeaveRequest.endDate = "invalid-date";

    // Act
    const errors = await validate(invalidLeaveRequest);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty("isDateString");
  });

  it("a leave request with an invalid status is considered invalid", async () => {
    // Arrange
    const invalidLeaveRequest = getValidLeaveRequest();
    invalidLeaveRequest.status = "invalid-status" as any;

    // Act
    const errors = await validate(invalidLeaveRequest);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty("isIn");
  });

  it("a leave request with an invalid annual leave is considered invalid", async () => {
    // Arrange
    const invalidLeaveRequest = getValidLeaveRequest();
    invalidLeaveRequest.type = "invalid-leave-type" as any;

    // Act
    const errors = await validate(invalidLeaveRequest);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty("isIn");
  });

  it("a leave request status defaults to pending", async () => {
    // Arrange
    const validLeaveRequest = getValidLeaveRequest();

    // Act
    const errors = await validate(validLeaveRequest);

    // Assert
    expect(errors.length).toBe(0);
    expect(validLeaveRequest.status).toBe("pending");
  });

  it("a leave request without a type defaults to 'Annual Leave'", async () => {
    // Arrange
    const validLeaveRequest = getValidLeaveRequest();

    // Act
    const errors = await validate(validLeaveRequest);

    // Assert
    expect(errors.length).toBe(0);
    expect(validLeaveRequest.type).toBe("Annual Leave");
  });
});
