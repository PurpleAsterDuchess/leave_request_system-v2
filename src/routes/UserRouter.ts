import { Router } from "express"; // Correctly import Router
import { UserController } from "../controllers/UserController";
import { IRouter } from "./IRouter";
import { IGetByEmail } from "../controllers/IGetByEmail";

export class UserRouter implements IRouter{
  public routeName = "users";
  public basePath = "/api/users";
  public authenticate = true;

  constructor(
    private router: Router,
    private userController: IGetByEmail
  ) {
    this.router = router;
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

    // Delete
    this.router.delete("/:id", this.userController.delete);

    // Patch
    this.router.patch("/", this.userController.update);
  }
}
