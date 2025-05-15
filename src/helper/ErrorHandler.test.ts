import { AppError } from "./AppError";
import { ErrorHandler } from "./ErrorHandler";
import { Response } from "express";

jest.mock("./Logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

jest.mock("./ResponseHandler", () => ({
  sendErrorResponse: jest.fn(),
}));

describe("ErrorHandler", () => {
  it("should handle errors correctly", () => {
    // Arrange
    const mockError = new Error("Test error") as AppError;
    mockError.statusCode = 500;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(), // Add the send method to fix the issue
    } as unknown as Response;

    // Act
    ErrorHandler.handle(mockError, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      message: "Test error",
    });
  });
});
