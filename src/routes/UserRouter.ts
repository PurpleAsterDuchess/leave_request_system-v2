import { Router } from "express";
import { UserController } from "@controllers/UserController";
import { IRouter } from "./IRouter";
import { IGetByEmail } from "@controllers/IGetByEmail";
import { IResetAl } from "@controllers/IResetAl";

export class UserRouter implements IRouter {
  public routeName = "users";
  public basePath = "/api/users";
  public authenticate = true;

  constructor(
    private router: Router,
    private userController: IGetByEmail & IResetAl
  ) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    // Get
    this.router.get("/", this.userController.getAll);
    this.router.get("/email/:emailAddress", this.userController.getByEmail);
    this.router.get("/:id", this.userController.getById);

    // Post
    this.router.post("/", this.userController.create);
    this.router.post("/:id/reset-Al", this.userController.resetAl);

    // Delete
    this.router.delete("/:id", this.userController.delete);

    // Patch
    this.router.patch("/", this.userController.update);
  }
}
