import express, { Request, Response, NextFunction } from "express";
import { DataSource } from "typeorm";

import { LoginRouter } from "./routes/LoginRouter";
import { RoleRouter } from "./routes/RoleRouter";
import { UserRouter } from "./routes/UserRouter";
import { LeaveRouter } from "./routes/LeaveRouter";

import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "./helper/ResponseHandler";
import { Logger } from "./helper/Logger";
import morgan, { StreamOptions } from "morgan";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
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

  private readonly loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max requests per window
    message: "Too many requests - try again later",
    standardHeaders: true, // Return Rate limit info in the RateLimit-* headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
  });

  private readonly jwtRateLimiter = (userEmail: string) =>
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // max requests per window
      message: "Too many requests - try again later",
      standardHeaders: true, // Return Rate limit info in the RateLimit-* headers
      legacyHeaders: false, // Disable the X-RateLimit-* headers
      keyGenerator: (req) => userEmail,
    });

  constructor(
    private readonly port: string | number,
    private readonly routers: IRouter[],
    private readonly appDataSource: DataSource
  ) {
    this.app = express();

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
      const middlewares: express.RequestHandler[] = []

      if (route.authenticate) {
        middlewares.push(MiddlewareFactory.authenticateToken)
      }

      if (route.basePath === "/api/login") {
        middlewares.push(MiddlewareFactory.loginLimiter);
      } else {
        middlewares.push(MiddlewareFactory.jwtRateLimitMiddleware(route.routeName))
      }

      middlewares.push(MiddlewareFactory.logRouteAccess(route.routeName))

      this.app.use(route.basePath, ...middlewares, route.getRouter())
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
  private authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const tokenReceived = authHeader.split(" ")[1];

      if (!process.env.JWT_SECRET) {
        //added
        Logger.error(Server.ERROR_TOKEN_SECRET_NOT_DEFINED);
        throw new Error(Server.ERROR_TOKEN_SECRET_NOT_DEFINED);
      }

      jwt.verify(tokenReceived, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
          Logger.error(Server.ERROR_TOKEN_IS_INVALID);
          return ResponseHandler.sendErrorResponse(
            res,
            StatusCodes.UNAUTHORIZED,
            Server.ERROR_TOKEN_IS_INVALID
          );
        }

        const {
          token: { email, role, uid },
        } = payload as any;

        if (!email || !role) {
          Logger.error(Server.ERROR_TOKEN_IS_INVALID);
          return ResponseHandler.sendErrorResponse(
            res,
            StatusCodes.UNAUTHORIZED,
            Server.ERROR_TOKEN_IS_INVALID
          );
        }

        req.signedInUser = { email, role, uid };
        next();
      });
    } else {
      Logger.error(Server.ERROR_TOKEN_NOT_FOUND);
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        Server.ERROR_TOKEN_NOT_FOUND
      );
    }
  }
  private logRouteAccess(route: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      Logger.info(`${route} accessed by ${req.ip}`);
      next();
    };
  }
  private jwtRateLimitMiddleware(route: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const email = req.signedInUser?.email;

      if (email) {
        Logger.info(`${route} accessed by ${req.ip}`);
        this.jwtRateLimiter(email)(req, res, next);
      } else {
        const ERROR_MESSAGE = "Missing essential information in JWT";
        Logger.error(ERROR_MESSAGE);
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          ERROR_MESSAGE
        );
      }
    };
  }
}
