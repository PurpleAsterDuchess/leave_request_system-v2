import { Router } from "express";
import { LeaveController } from "@controllers/LeaveController";
import { IRouter } from "./IRouter";

export class LeaveRouter implements IRouter {
  public routeName = "leave";
  public basePath = "/api/leave";
  public authenticate = true;

  private router: Router;
  private leaveController: LeaveController;

  constructor(router: Router, leaveController: LeaveController) {
    this.router = router;
    this.leaveController = leaveController;
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    // Get
    this.router.get("/", this.leaveController.getAll);
    this.router.get("/:id", this.leaveController.getById);

    // Post
    this.router.post("/", this.leaveController.create);

    // Delete
    this.router.delete("/:id", this.leaveController.delete);

    // Patch
    this.router.patch("/", this.leaveController.update);
  }
}
