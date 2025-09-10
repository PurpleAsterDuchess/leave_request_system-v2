import express from "express";
import { DataSource } from "typeorm";
import cors from "cors"

import { Logger } from "./helper/Logger";
import morgan, { StreamOptions } from "morgan";

import { IRouter } from "./routes/IRouter";
import { ErrorHandler } from "./helper/ErrorHandler";
import { MiddlewareFactory } from "./helper/MiddlewareFactory";
export class Server {
  private readonly app: express.Application;

  public static readonly ERROR_TOKEN_IS_INVALID =
    "Not authorised - Token is invalid";
  public static readonly ERROR_TOKEN_NOT_FOUND =
    "Not authorised - Token not found";
  public static readonly ERROR_TOKEN_SECRET_NOT_DEFINED =
    "Secret token not defined";

  constructor(
    private readonly port: string | number,
    private readonly routers: IRouter[],
    private readonly appDataSource: DataSource
  ) {
    this.app = express();

    this.app.use(
      cors({
        origin: "http://localhost:5173", // frontend URL
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
      })
    );

    this.initialiseMiddlewares();
    this.initialiseRoutes();
    this.initialiseErrorHandling();
  }

  private initialiseMiddlewares() {
    const morganStream: StreamOptions = {
      write: (message: string): void => {
        Logger.info(message.trim());
      },
    };

    this.app.use(express.json());
    this.app.use(morgan("combined", { stream: morganStream }));
  }

  private initialiseRoutes() {
    for (const route of this.routers) {
      const middlewares: express.RequestHandler[] = [];

      if (route.authenticate) {
        middlewares.push(MiddlewareFactory.authenticateToken);
      }

      if (route.basePath === "/api/login") {
        middlewares.push(MiddlewareFactory.loginLimiter());
      } else {
        middlewares.push(
          MiddlewareFactory.jwtRateLimitMiddleware(route.routeName)
        );
      }

      middlewares.push(MiddlewareFactory.logRouteAccess(route.routeName));

      this.app.use(route.basePath, ...middlewares, route.getRouter());
    }
  }

  private initialiseErrorHandling() {
    //  this was this.app.get("*", ..) but it's been changed because we are using express 5
    this.app.use((err, req, res, next) => {
      ErrorHandler.handle(err, res);
    });
  }

  public async start() {
    await this.initialiseDataSource();
    this.app.listen(this.port, () => {
      Logger.info(`Server running on http://localhost:${this.port}`);
    });
  }

  private async initialiseDataSource() {
    try {
      await this.appDataSource.initialize();
      Logger.info("Data Source initialised");
    } catch (error) {
      Logger.error("Error during initialisation:", error);
      throw error;
    }
  }
}
