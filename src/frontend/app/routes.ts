import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/auth/login", "routes/auth/login.tsx"),
  route("/auth/logout", "routes/auth/logout.tsx"),
  route("my_leave", "routes/my_leave.tsx"),
  route("manager", "routes/manager.tsx"),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
