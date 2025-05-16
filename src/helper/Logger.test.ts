import { Logger } from "./Logger";
import * as winston from "winston";

jest.mock("winston", () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      simple: jest.fn(),
      colorize: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
  };
});

describe("Logger", () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = winston.createLogger();
  });

  it("should log info messages", () => {
    // Arrange
    const message = "Info message";
    const meta = { key: "value" };

    // Act
    Logger.info(message, meta);

    // Assert
    expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
  });

  it("should log error messages", () => {
    // Arrange
    const message = "Error message";
    const meta = { key: "value" };

    // Act
    Logger.error(message, meta);

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(message, meta);
  });

  it("should log warning messages", () => {
    // Arrange
    const message = "Warning message";
    const meta = { key: "value" };

    // Act
    Logger.warn(message, meta);

    // Assert
    expect(mockLogger.warn).toHaveBeenCalledWith(message, meta);
  });

  it("should log debug messages", () => {
    // Arrange
    const message = "Debug message";
    const meta = { key: "value" };

    // Act
    Logger.debug(message, meta);

    // Assert
    expect(mockLogger.debug).toHaveBeenCalledWith(message, meta);
  });

  it("should log trace messages", () => {
    // Arrange
    const message = "Trace message";
    const meta = { key: "value" };

    // Act
    Logger.trace(message, meta);

    // Assert
    expect(mockLogger.verbose).toHaveBeenCalledWith(message, meta);
  });
});
