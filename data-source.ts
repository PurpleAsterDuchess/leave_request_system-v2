import "reflect-metadata";
import { DataSource } from "typeorm";
import { Role } from "./src/api/entity/Role";
import { User } from "./src/api/entity/User";
import * as dotenv from "dotenv";
import { LeaveRequest } from "./src/api/entity/LeaveRequest";

const envPath = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envPath });

console.log("DB config:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  db: process.env.DB_DATABASE,
});

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: false,
  entities: [Role, User, LeaveRequest],
});
