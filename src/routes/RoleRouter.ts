import { Router } from "express";
import { IRouter } from "./IRouter";
import { IEntityController } from "../controllers/IEntityControllers";

export class RoleRouter implements IRouter {
  public routeName = "roles";
  public basePath = "/api/roles";
  public authenticate = true;

  constructor(
    private router: Router,
    private roleController: IEntityController
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    // Get
    this.router.get("/", this.roleController.getAll);
    this.router.get("/:id", this.roleController.getById);

    // Post
    this.router.post("/", this.roleController.create);

    // Delete
    this.router.delete("/:id", this.roleController.delete);

    // Patch
    this.router.patch("/", this.roleController.update);
  }
}
