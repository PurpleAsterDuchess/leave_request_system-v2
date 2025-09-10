import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("home", "routes/home.tsx"),
  route("my_leave", "routes/my_leave.tsx"),
  route("manager", "routes/manager.tsx"),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
