import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("my_leave", "routes/my_leave.tsx"),
  route("login", "routes/login.tsx"),
] satisfies RouteConfig;
