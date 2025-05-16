import { Router } from "express";
import { StaffLeaveController } from "@controllers/StaffLeaveController";
import { IRouter } from "./IRouter";

export class StaffLeaveRouter implements IRouter {
  public routeName = "staff";
  public basePath = "/api/leave/staff";
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
    this.router.get("/", this.staffLeaveController.getAll);
    this.router.get("/:id", this.staffLeaveController.getById);

    // Post
    this.router.post("/", this.staffLeaveController.create);

    // Delete
    this.router.delete("/:id", this.staffLeaveController.delete);

    // Patch
    this.router.patch("/", this.staffLeaveController.update);
  }
}
