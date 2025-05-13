import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";
import { instanceToPlain } from "class-transformer";
import { LeaveRequest } from "../entity/LeaveRequest";
import { IEntityController } from "./IEntityControllers";

export class LeaveController implements IEntityController {
  public static readonly ERROR_NO_USER_ID_PROVIDED = "No ID provided";
  public static readonly ERROR_INVALID_USER_ID_FORMAT = "Invalid ID format";
  public static readonly ERROR_FAILED_TO_RETRIEVE_LEAVES =
    "Failed to retrieve leaves";
  public static readonly ERROR_FAILED_TO_RETRIEVE_LEAVE =
    "Failed to retrieve leave";
  public static readonly ERROR_LEAVE_NOT_FOUND_FOR_DELETION =
    "Leave with the provided ID not found";
  public static readonly ERROR_USER_REQUIRED = "User is required";
  public static readonly ERROR_RETRIEVING_LEAVE = (error: string) =>
    `Error retrieving leave: ${error}`;
  public static readonly ERROR_LEAVE_EXCEEDS_AL =
    "Dates provided are greater than allowed AL";
  public static readonly ERROR_VALIDATION_FAILED = "Validation failed";
  public static readonly ERROR_UNAUTHORIZED_ACTION =
    "Invalid authorization for this action";

  private leaveRepository: Repository<LeaveRequest>;
  private userRepository: Repository<User>;

  constructor() {
    this.leaveRepository = AppDataSource.getRepository(LeaveRequest);
    this.userRepository = AppDataSource.getRepository(User);
  }

  public dateDiff = (start, end) => {
    end = new Date(end);
    start = new Date(start);
    const daysDifference =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    return daysDifference;
  };

  // Admin can get all leave requests
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaveRequests = await this.leaveRepository.find({
        relations: ["user"], // Include all user fields in response
      });

      if (leaveRequests.length === 0) {
        ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
        return;
      }

      // Only show all leave if signed in user is admin
      if (req.signedInUser.role.id !== 1) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.FORBIDDEN,
          LeaveController.ERROR_UNAUTHORIZED_ACTION
        );
        return;
      }

      ResponseHandler.sendSuccessResponse(res, leaveRequests);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${LeaveController.ERROR_FAILED_TO_RETRIEVE_LEAVE}: ${error.message}`
      );
    }
  };

  // Admin and managers can approve/reject leave
  public update = async (req: Request, res: Response): Promise<void> => {
    const id = req.body.id;
    try {
      const leave = await this.leaveRepository.findOne({
        where: { leaveId: id },
        relations: ["user"],
      });

      // Find the manager of the user that has requested that leave
      const userRepository = AppDataSource.getRepository(User);
      const uid = leave.user.id;
      const user = await userRepository.findOne({
        where: { id: uid },
        relations: ["manager"], // Load the embedded manager user
      });

      // Check signed in user is either an admin or the user's line manager
      if (
        req.signedInUser.role.id === 1 ||
        user.manager?.id === req.signedInUser.uid
      ) {
        let date = new Date();

        leave.status = req.body.status;
        leave.updatedAt = date;

        if (leave.status === "rejected") {
          const daysDifference = this.dateDiff(leave.endDate, leave.startDate);

          const newRemainingAl = leave.user.remainingAl + daysDifference;
          leave.user.remainingAl = newRemainingAl;
        }

        ResponseHandler.sendSuccessResponse(res, leave, StatusCodes.ACCEPTED);
      } else {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.FORBIDDEN,
          LeaveController.ERROR_UNAUTHORIZED_ACTION
        );
      }
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        LeaveController.ERROR_RETRIEVING_LEAVE(error.message)
      );
    }
  };

  // Managers can view their staff's leave

  // Staff can view their own leave
  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Fetch leave requests only for the signed-in user
      const leaves = await this.leaveRepository.find({
        where: { user: { id: req.signedInUser.uid } }, // Filter by signed-in user's ID
        relations: ["user"], // Include user details in the response
      });
      console.log(req.signedInUser.uid)

      // Return the leave requests for the signed-in user
      ResponseHandler.sendSuccessResponse(res, leaves);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        LeaveController.ERROR_RETRIEVING_LEAVE(error.message)
      );
    }
  };

  // Staff can create their own leave
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      let leaveRequest = new LeaveRequest();

      // Get current datetime
      let date = new Date();
      leaveRequest.user = await AppDataSource.getRepository(
        User
      ).findOneByOrFail({
        id: req.signedInUser.uid,
      });
      leaveRequest.createdAt = date;
      leaveRequest.startDate = req.body.startDate;
      leaveRequest.endDate = req.body.endDate;

      if (req.body.reason) {
        leaveRequest.reason = req.body.reason;
      }

      // Only AL for now byt can be changed
      if (req.body.type) {
        leaveRequest.type = req.body.type;
      }

      const daysDifference = this.dateDiff(
        leaveRequest.endDate,
        leaveRequest.startDate
      );

      const newRemainingAl = leaveRequest.user.remainingAl - daysDifference;

      // Check remaining al is not negative
      if (newRemainingAl < 0) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          LeaveController.ERROR_LEAVE_EXCEEDS_AL
        );
        return;
      }

      // Update remaining leave
      leaveRequest.user.remainingAl = newRemainingAl;
      console.log(this.userRepository);
      await this.userRepository.save(leaveRequest.user);

      leaveRequest = await this.leaveRepository.save(leaveRequest);

      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(leaveRequest),
        StatusCodes.CREATED
      );
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        LeaveController.ERROR_RETRIEVING_LEAVE(error.message)
      );
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
      if (!id) {
        throw new Error("No ID provided");
      }

      // find a specific leave id and include user
      const leaveRequest = await this.leaveRepository.findOne({
        where: { leaveId: id },
        relations: ["user"],
      });

      if (leaveRequest.user.id !== req.signedInUser.uid) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.FORBIDDEN,
          LeaveController.ERROR_UNAUTHORIZED_ACTION
        );
        return;
      } else {
        const daysDifference = this.dateDiff(
          leaveRequest.endDate,
          leaveRequest.startDate
        );

        const newRemainingAl = leaveRequest.user.remainingAl + daysDifference;
        leaveRequest.user.remainingAl = newRemainingAl;

        const result = await this.leaveRepository.delete(id);
        if (result.affected === 0) {
          throw new Error(LeaveController.ERROR_LEAVE_NOT_FOUND_FOR_DELETION);
        }
      }

      ResponseHandler.sendSuccessResponse(
        res,
        "Leave request deleted",
        StatusCodes.OK
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message
      );
    }
  };
}
