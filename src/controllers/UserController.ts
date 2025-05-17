import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";
import { validate } from "class-validator";
import { instanceToPlain } from "class-transformer";
import { Role } from "../entity/Role";
import { AppError } from "../helper/AppError";
import { IEntityController } from "./IEntityControllers";

export class UserController implements IEntityController {
  public static readonly ERROR_NO_USER_ID_PROVIDED = "No ID provided";
  public static readonly ERROR_INVALID_USER_ID_FORMAT = "Invalid ID format";
  public static readonly ERROR_USER_NOT_FOUND = "User not found";
  public static readonly ERROR_USER_NOT_FOUND_WITH_ID = (id: number) =>
    `User not found with ID: ${id}`;
  public static readonly ERROR_EMAIL_REQUIRED = "Email is required";

  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  // Allow reset of AL
  async resetAnnualLeave(uid: number): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid });
    if (!user) throw new AppError("User not found");

    user.remainingAl = user.initialAlTotal;
    await this.userRepository.save(user);
  }

  // Get all users
  public getAll = async (req: Request, res: Response): Promise<void> => {
    const users = await this.userRepository.find({
      relations: ["manager", "role"], // Include all  role fields in response
    });

    if (users.length === 0) {
      ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
    }

    ResponseHandler.sendSuccessResponse(res, users);
  };

  public getByEmail = async (req: Request, res: Response): Promise<void> => {
    const email = req.params.emailAddress;

    if (!email || email.trim().length === 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_EMAIL_REQUIRED
      );
      return;
    }

    const user = await this.userRepository.findOne({
      where: { email: email },
      relations: ["role"],
    });
    if (!user) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        `${email} not found`
      );
      return;
    }

    ResponseHandler.sendSuccessResponse(res, user);
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_INVALID_USER_ID_FORMAT
      );
      return;
    }

    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ["role"],
    });
    if (!user) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NO_CONTENT,
        UserController.ERROR_USER_NOT_FOUND_WITH_ID(id)
      );
      return;
    }

    ResponseHandler.sendSuccessResponse(res, user);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    let user = new User();

    //Will be salted and hashed in the entity
    user.password = req.body.password;

    user.email = req.body.email;
    user.role = req.body.roleId;
    user.firstname = req.body.firstname;
    user.surname = req.body.surname;

    // Create functionality so manager cannot be user
    if (req.body.manager !== undefined) {
      user.manager = req.body.manager;
    }

    if (req.body.initialAlTotal !== undefined) {
      user.initialAlTotal = req.body.initialAlTotal;
    }

    if (req.body.remainingAl !== undefined) {
      user.remainingAl = req.body.remainingAl;
    }

    const errors = await validate(user);
    if (errors.length > 0) {
      //Collate a string of all decorator error messages
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(", ")
      );
    }

    if (req.signedInUser.role.id === 1) {
      user = await this.userRepository.save(user);
    } else {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        "Invalid authorization for this action"
      );
    }

    ResponseHandler.sendSuccessResponse(
      res,
      instanceToPlain(user),
      StatusCodes.CREATED
    );
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      throw new AppError("No ID provided");
    }

    if (req.signedInUser.role.id === 1) {
      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        throw new AppError("User with the provided ID not found");
      }
    } else {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        "Invalid authorization for this action"
      );
    }
    ResponseHandler.sendSuccessResponse(res, "User deleted", StatusCodes.OK);
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const id = req.body.id;

    if (!id) {
      throw new AppError(UserController.ERROR_NO_USER_ID_PROVIDED);
    }

    let user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password") // explicitly select the password
      .leftJoinAndSelect("user.manager", "manager")
      .leftJoinAndSelect("user.role", "role")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) {
      throw new AppError(UserController.ERROR_USER_NOT_FOUND);
    }

    // Update specific fields
    if (req.body.email !== undefined) {
      user.email = req.body.email;
    }

    if (req.body.roleId !== undefined) {
      const role = await this.roleRepository.findOneBy({
        id: req.body.roleId,
      });
      if (!role) throw new AppError("Invalid role ID.");
      user.role = role;
    }

    if (req.body.managerId !== undefined) {
      const manager = await this.userRepository.findOneBy({
        id: req.body.managerId,
      });
      if (!manager) throw new AppError("Invalid manager ID.");
      user.manager = manager;
    }

    if (req.body.firstname !== undefined) {
      user.firstname = req.body.firstname;
    }

    if (req.body.surname !== undefined) {
      user.surname = req.body.surname;
    }

    const errors = await validate(user);
    if (errors.length > 0) {
      //Collate a string of all decorator error messages
      throw new AppError(
        errors
          .map((e) => Object.values(e.constraints || {}))
          .flat()
          .join(", ")
      );
    }

    if (req.signedInUser.role.id === 1) {
      user = await this.userRepository.save(user);
    } else {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        "Invalid authorization for this action"
      );
    }

    ResponseHandler.sendSuccessResponse(res, user, StatusCodes.OK);
  };

  public resetAl = async (req: Request, res: Response): Promise<void> => {
    if (req.signedInUser.role.id === 1) {
      const user = await this.userRepository.findOneBy({
        id: Number(req.params.id),
      });
      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          UserController.ERROR_USER_NOT_FOUND
        );
        return;
      }
      user.remainingAl = user.initialAlTotal;
      await this.userRepository.save(user);
      ResponseHandler.sendSuccessResponse(res, user, StatusCodes.OK);
    } else {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        "Invalid authorization for this action"
      );
    }
  };
}
