import { Response } from "express";
import { Logger } from "./Logger";
import { ResponseHandler } from "./ResponseHandler";
import { AppError } from "./AppError";

export class ErrorHandler {
  static handle(err: AppError, res: Response): void {
    Logger.error(err.message);
    ResponseHandler.sendErrorResponse(res, err.statusCode, err.message);
  }
}
