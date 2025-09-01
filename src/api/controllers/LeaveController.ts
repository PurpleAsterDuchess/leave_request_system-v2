import { Request, Response } from "express";
import { AppDataSource } from "../../../data-source";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";
import { instanceToPlain } from "class-transformer";
import { LeaveRequest } from "../entity/LeaveRequest";
import { IEntityController } from "./IEntityControllers";

export class LeaveController implements IEntityController {
  public static readonly ERROR_NO_LEAVE_ID_PROVIDED = "No ID provided";
  public static readonly ERROR_LEAVE_NOT_FOUND_FOR_DELETION =
    "Leave with the provided ID not found";
  public static readonly ERROR_INVALID_DATE = "Invalid start or end date";
  public static readonly ERROR_UNAUTHORIZED_ACTION =
    "Invalid authorization for this action";

  private leaveRepository: Repository<LeaveRequest>;
  private userRepository: Repository<User>;

  constructor() {
    this.leaveRepository = AppDataSource.getRepository(LeaveRequest);
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
        LeaveController.ERROR_INVALID_DATE
      );
    }
  };

  // Admin can get all leave requests
  public getAll = async (req: Request, res: Response): Promise<void> => {
    const currentUserRole = req.signedInUser.role.id;
    const currentUserId = req.signedInUser.uid;

    // Fetch all leave requests with embedded user details
    let leaveRequests;

    if (currentUserRole === 1) {
      // Admin: Fetch all leave requests and embedded users
      leaveRequests = await this.leaveRepository.find({
        relations: ["user"],
      });
    } else if (currentUserRole === 2) {
      // Manager: Fetch leave requests for users they manage and embedded managers
      leaveRequests = await this.leaveRepository.find({
        relations: ["user", "user.manager"],
        where: { user: { manager: { id: currentUserId } } },
      });
    } else {
      // Unauthorized role
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        LeaveController.ERROR_UNAUTHORIZED_ACTION
      );
      return;
    }

    // Check if any leave requests exist
    if (!leaveRequests || leaveRequests.length === 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NO_CONTENT,
        "No leave requests found."
      );
      return;
    }

    // Return the leave requests
    ResponseHandler.sendSuccessResponse(res, leaveRequests, StatusCodes.OK);
  };

  // Admin and managers can approve/reject leave
  public update = async (req: Request, res: Response): Promise<void> => {
    const id = req.body.id;
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
        const daysDifference = this.dateDiff(
          res,
          leave.endDate,
          leave.startDate
        );

        const newRemainingAl = leave.user.remainingAl + daysDifference;
        leave.user.remainingAl = newRemainingAl;
      }

      ResponseHandler.sendSuccessResponse(res, leave, StatusCodes.ACCEPTED);
    } else {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        LeaveController.ERROR_UNAUTHORIZED_ACTION
      );
    }
  };

  // Staff can view their own leave
  public getById = async (req: Request, res: Response): Promise<void> => {
    // Fetch leave requests only for the signed-in user
    const leaves = await this.leaveRepository.find({
      where: { user: { id: req.signedInUser.uid } }, // Filter by signed-in user's ID
      relations: ["user"], // Include user details in the response
    });

    // Return the leave requests for the signed-in user
    ResponseHandler.sendSuccessResponse(res, leaves);
  };

  // Managers can create leave for their staff
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUserId = req.signedInUser.uid; // Get the manager's ID
      const { uid, startDate, endDate, reason, type } = req.body;

      // Validate input
      if (!uid || !startDate || !endDate) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "User ID, start date, and end date are required."
        );
        return;
      }

      // Fetch the user (employee) for whom the leave is being created
      const employee = await this.userRepository.findOne({
        where: { id: uid, manager: { id: currentUserId } }, // Ensure the user is managed by the current manager
      });

      if (!employee) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          "Employee not found or you are not authorized to manage this user."
        );
        return;
      }

      // Calculate number of leave days requested
      const daysDifference = this.dateDiff(res, startDate, endDate);

      // Check if the employee has sufficient remaining leave balance
      if (employee.remainingAl < daysDifference) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Insufficient annual leave balance for the employee."
        );
        return;
      }

      // Create a new leave request
      const leaveRequest = new LeaveRequest();
      leaveRequest.user = employee; // Assign the employee to the leave request
      leaveRequest.startDate = startDate;
      leaveRequest.endDate = endDate;
      leaveRequest.reason = reason || ""; // Optional reason
      leaveRequest.type = type || "AL"; // Default to "Annual Leave" if type is not provided
      leaveRequest.createdAt = new Date();

      // Deduct the requested days from the employee's remaining leave balance
      employee.remainingAl -= daysDifference;
      await this.userRepository.save(employee);

      // Save the leave request
      const savedLeaveRequest = await this.leaveRepository.save(leaveRequest);

      // Respond with success
      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(savedLeaveRequest),
        StatusCodes.CREATED
      );
    } catch (error) {
      // Handle unexpected errors
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to create leave request: ${error.message}`
      );
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        LeaveController.ERROR_NO_LEAVE_ID_PROVIDED
      );
      return;
    }

    // find a specific leave id and include user
    const leaveRequest = await this.leaveRepository.findOne({
      where: { leaveId: id },
      relations: ["user"],
    });

    if (!leaveRequest) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        LeaveController.ERROR_LEAVE_NOT_FOUND_FOR_DELETION
      );
      return;
    }

    // Only the owner of the leave can delete it
    if (leaveRequest.user.id !== req.signedInUser.uid) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        LeaveController.ERROR_UNAUTHORIZED_ACTION
      );
      return;
    }

    // Calculate days difference and update user's remaining AL
    const daysDifference = this.dateDiff(
      res,
      leaveRequest.startDate,
      leaveRequest.endDate
    );
    if (typeof daysDifference !== "number" || isNaN(daysDifference)) {
      // dateDiff already sends error response
      return;
    }

    leaveRequest.user.remainingAl += daysDifference;
    await this.userRepository.save(leaveRequest.user);

    const result = await this.leaveRepository.delete(id);
    if (result.affected === 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        LeaveController.ERROR_LEAVE_NOT_FOUND_FOR_DELETION
      );
      return;
    }

    ResponseHandler.sendSuccessResponse(
      res,
      "Leave request deleted",
      StatusCodes.OK
    );
  };
}
