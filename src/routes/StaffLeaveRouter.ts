import { Router } from "express";
import { StaffLeaveController } from "../controllers/StaffLeaveController";
import { IRouter } from "./IRouter";

export class StaffLeaveRouter implements IRouter {
  public routeName = "leave";
  public basePath = "/api/leave";
  public authenticate = true;

  private router: Router;
  private staffLeaveController: StaffLeaveController;

  constructor(router: Router, staffLeaveController: StaffLeaveController) {
    this.router = router;
    this.staffLeaveController = staffLeaveController;
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    // Get
    this.router.get("/staff/", this.staffLeaveController.getAll);
    this.router.get("/staff/:id", this.staffLeaveController.getById);

    // Post
    this.router.post("/staff/", this.staffLeaveController.create);

    // Delete
    this.router.delete("/staff/:id", this.staffLeaveController.delete);

    // Patch
    this.router.patch("/staff/", this.staffLeaveController.update);
  }
}
