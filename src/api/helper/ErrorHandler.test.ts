import { AppError } from "./AppError";
import { ErrorHandler } from "./ErrorHandler";
import { Response } from "express";
import { ResponseHandler } from "./ResponseHandler";

jest.mock("./Logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));
jest.mock("./ResponseHandler", () => ({
  ResponseHandler: {
    sendErrorResponse: jest.fn(),
  },
}));

describe("ErrorHandler", () => {
  it("should handle errors correctly", () => {
    // Arrange
    const mockError = new Error("Test error") as AppError;
    (mockError as any).statusCode = 500;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Act
    ErrorHandler.handle(mockError, mockResponse);

    // Assert
    // If ErrorHandler.handle uses ResponseHandler.sendErrorResponse, check that instead
    const { ResponseHandler } = require("./ResponseHandler");
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      mockResponse,
      500,
      "Test error"
    );
  });
});
