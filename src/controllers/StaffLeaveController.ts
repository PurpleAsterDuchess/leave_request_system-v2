import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";
import { instanceToPlain } from "class-transformer";
import { LeaveRequest } from "../entity/LeaveRequest";
import { IEntityController } from "./IEntityControllers";

export class StaffLeaveController implements IEntityController {
  public static readonly ERROR_NO_LEAVE_ID_PROVIDED = "No ID provided";
  public static readonly ERROR_INVALID_USER_ID_FORMAT = "Invalid ID format";
  public static readonly ERROR_FAILED_TO_RETRIEVE_LEAVE_REQUESTS =
    "Failed to retrieve leave requests";
  public static readonly ERROR_FAILED_TO_RETRIEVE_LEAVE_REQUEST =
    "Failed to retrieve leave request";
  public static readonly ERROR_LEAVE_NOT_FOUND_FOR_DELETION =
    "Leave with the provided ID not found";
  public static readonly ERROR_RETRIEVING_LEAVE = (error: string) =>
    `Error retrieving leave: ${error}`;
  public static readonly ERROR_INVALID_DATE = "Invalid start or end date";
  public static readonly ERROR_LEAVE_NOT_FOUND_WITH_ID = (id: number) =>
    `Error retrieving leave with id: ${id}`;
  public static readonly ERROR_LEAVE_EXCEEDS_AL =
    "Dates provided are greater than allowed AL";
  public static readonly ERROR_UNAUTHORIZED_ACTION =
    "Invalid authorization for this action";

  private staffLeaveRepository: Repository<LeaveRequest>;
  private userRepository: Repository<User>;

  constructor() {
    this.staffLeaveRepository = AppDataSource.getRepository(LeaveRequest);
    this.userRepository = AppDataSource.getRepository(User);
  }

  public dateDiff = (res, start, end) => {
    end = new Date(end);
    start = new Date(start);
    const daysDifference =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    if (daysDifference > 0) {
      return daysDifference;
    } else {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        StaffLeaveController.ERROR_INVALID_DATE
      );
    }
  };

  // Staff can get all of their own leave requests
  public getAll = async (req: Request, res: Response): Promise<void> => {
    console.log("here");
    // Fetch leave requests only for the signed-in user
    const leaves = await this.staffLeaveRepository.find({
      where: { user: { id: req.signedInUser.uid } }, // Filter by signed-in user's ID
      relations: ["user"], // Include user details in the response
    });

    // Return the leave requests for the signed-in user
    ResponseHandler.sendSuccessResponse(res, leaves);
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        StaffLeaveController.ERROR_INVALID_USER_ID_FORMAT
      );
      return;
    }

    const leave = await this.staffLeaveRepository.findOne({
      where: { leaveId: id },
    });
    if (!leave) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NO_CONTENT,
        StaffLeaveController.ERROR_LEAVE_NOT_FOUND_WITH_ID(id)
      );
      return;
    }

    ResponseHandler.sendSuccessResponse(res, leave);
  };

  // Staff can cancel their own leave
  public update = async (req: Request, res: Response): Promise<void> => {
    const { id, startDate, endDate } = req.body;

    // Fetch the existing leave request from the database
    const leaveRequest = await this.staffLeaveRepository.findOneByOrFail({
      leaveId: id,
    });

    if (!leaveRequest) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        StaffLeaveController.ERROR_FAILED_TO_RETRIEVE_LEAVE_REQUEST
      );
      return;
    }

    // Check if the startDate or endDate has changed
    const isStartDateChanged =
      startDate && startDate !== leaveRequest.startDate;
    const isEndDateChanged = endDate && endDate !== leaveRequest.endDate;

    if (isStartDateChanged || isEndDateChanged) {
      // Recalculate the days difference
      const newDaysDifference = this.calculateDays(
        startDate || leaveRequest.startDate,
        endDate || leaveRequest.endDate
      );

      // Update the leave request with new dates and days difference
      if (isStartDateChanged) leaveRequest.startDate = startDate;
      if (isEndDateChanged) leaveRequest.endDate = endDate;

      const user = await this.userRepository.findOneByOrFail({
        id: leaveRequest.user.id,
      });
      const previousDaysDifference = this.calculateDays(
        leaveRequest.startDate,
        leaveRequest.endDate
      );

      user.remainingAl += previousDaysDifference;
      user.remainingAl -= newDaysDifference;

      await this.userRepository.save(user);

      leaveRequest.updatedAt = new Date();
      await this.staffLeaveRepository.save(leaveRequest);

      ResponseHandler.sendSuccessResponse(res, leaveRequest, StatusCodes.OK);
    } else {
      // No changes to startDate or endDate, just return the original request
      ResponseHandler.sendSuccessResponse(res, leaveRequest, StatusCodes.OK);
    }
  };

  // Helper function to calculate the number of days between two dates
  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      ) + 1
    );
  }

  // Staff can create their own leave
  public create = async (req: Request, res: Response): Promise<void> => {
    let leaveRequest = new LeaveRequest();

    // Get current datetime
    let date = new Date();
    leaveRequest.user = await this.userRepository.findOneByOrFail({
      id: req.signedInUser.uid,
    });
    leaveRequest.createdAt = date;
    leaveRequest.startDate = req.body.startDate;
    leaveRequest.endDate = req.body.endDate;

    if (req.body.reason) {
      leaveRequest.reason = req.body.reason;
    }

    // Only AL for now but can be changed
    if (req.body.type) {
      leaveRequest.type = req.body.type;
    }

    const daysDifference = this.dateDiff(
      res,
      leaveRequest.endDate,
      leaveRequest.startDate
    );

    const newRemainingAl = leaveRequest.user.remainingAl - daysDifference;

    // Check remaining al is not negative
    if (newRemainingAl < 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        StaffLeaveController.ERROR_LEAVE_EXCEEDS_AL
      );
      return;
    }

    // Update remaining leave
    leaveRequest.user.remainingAl = newRemainingAl;
    console.log(this.userRepository);
    await this.userRepository.save(leaveRequest.user);

    leaveRequest = await this.staffLeaveRepository.save(leaveRequest);

    ResponseHandler.sendSuccessResponse(
      res,
      instanceToPlain(leaveRequest),
      StatusCodes.CREATED
    );
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      throw new Error(StaffLeaveController.ERROR_NO_LEAVE_ID_PROVIDED);
    }

    // find a specific leave id and include user
    const leaveRequest = await this.staffLeaveRepository.findOne({
      where: { leaveId: id },
      relations: ["user"],
    });

    if (leaveRequest.user.id !== req.signedInUser.uid) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        StaffLeaveController.ERROR_UNAUTHORIZED_ACTION
      );

      return;
    } else {
      const daysDifference = this.dateDiff(
        res,
        leaveRequest.endDate,
        leaveRequest.startDate
      );

      const newRemainingAl = leaveRequest.user.remainingAl + daysDifference;
      leaveRequest.user.remainingAl = newRemainingAl;

      const result = await this.staffLeaveRepository.delete(id);
      if (result.affected === 0) {
        throw new Error(
          StaffLeaveController.ERROR_LEAVE_NOT_FOUND_FOR_DELETION
        );
      }
    }

    ResponseHandler.sendSuccessResponse(
      res,
      "Leave request deleted",
      StatusCodes.OK
    );
  };
}
