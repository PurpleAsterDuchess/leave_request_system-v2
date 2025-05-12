import { Server } from "./Server";
import { Router } from "express";
import { AppDataSource } from "./data-source";

import { RoleRouter } from "./routes/RoleRouter";
import { RoleController } from "./controllers/RoleController";
import { UserRouter } from "./routes/UserRouter";
import { UserController } from "./controllers/UserController";
import { LoginRouter } from "./routes/LoginRouter";
import { LoginController } from "./controllers/LoginController";
import { LeaveRouter } from "./routes/LeaveRouter";
import { LeaveController } from "./controllers/LeaveController";

//Initialise the port
const DEFAULT_PORT = 8900;
const port = process.env.SERVER_PORT || DEFAULT_PORT;
if (!process.env.SERVER_PORT) {
  console.log(
    "PORT environment variable is not set, defaulting to " + DEFAULT_PORT
  );
}
// Initialise the data source
const appDataSource = AppDataSource;

// Initialise routers
const routers = [
  new LoginRouter(Router(), new LoginController()),
  new RoleRouter(Router(), new RoleController()),
  new UserRouter(Router(), new UserController()),
  new LeaveRouter(Router(), new LeaveController()),
];

// Instantiate/start the server
const server = new Server(
  port,
  routers,
  appDataSource
);
server.start();
