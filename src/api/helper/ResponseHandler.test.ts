import { ResponseHandler } from "./ResponseHandler";
import { Response } from "express";
import { Logger } from "./Logger";
import { StatusCodes } from "http-status-codes";

jest.mock("./Logger");

describe("ResponseHandler", () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("sendErrorResponse", () => {
    it("should log the error and send an error response", () => {
      // Arrange
      const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      const message = "Test error message";

      // Act
      ResponseHandler.sendErrorResponse(
        mockResponse as Response,
        statusCode,
        message
      );

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(
        `[Error]: ${message}`,
        expect.any(String)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message,
          status: statusCode,
          timestamp: expect.any(String),
        },
      });
    });

    it("should use the default message if none is provided", () => {
      // Arrange
      const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

      // Act
      ResponseHandler.sendErrorResponse(mockResponse as Response, statusCode);

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(
        `[Error]: Unexpected error`,
        expect.any(String)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: "Unexpected error",
          status: statusCode,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("sendSuccessResponse", () => {
    it("should send a success response with data", () => {
      // Arrange
      const data = { key: "value" };
      const statusCode = StatusCodes.OK;

      // Act
      ResponseHandler.sendSuccessResponse(
        mockResponse as Response,
        data,
        statusCode
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.send).toHaveBeenCalledWith({ data });
    });

    it("should use the default status code if none is provided", () => {
      // Arrange
      const data = { key: "value" };

      // Act
      ResponseHandler.sendSuccessResponse(mockResponse as Response, data);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.send).toHaveBeenCalledWith({ data });
    });

    it("should send an empty object if no data is provided", () => {
      // Act
      ResponseHandler.sendSuccessResponse(mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.send).toHaveBeenCalledWith({ data: {} });
    });
  });
});
