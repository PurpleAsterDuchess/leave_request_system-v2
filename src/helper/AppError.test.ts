import { AppError } from "./AppError";
import { StatusCodes } from "http-status-codes";

describe("AppError", () => {
  it.only("should create an error with a custom message and status code", () => {
    // Arrange
    const message = "Custom error message";
    const statusCode = StatusCodes.BAD_REQUEST;

    // Act
    const error = new AppError(message, statusCode);

    // Assert
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.stack).toBeDefined();
  });

  it("should default to INTERNAL_SERVER_ERROR if no status code is provided", () => {
    // Arrange
    const message = "Default error message";

    // Act
    const error = new AppError(message);

    // Assert
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(error.stack).toBeDefined();
  });
});
