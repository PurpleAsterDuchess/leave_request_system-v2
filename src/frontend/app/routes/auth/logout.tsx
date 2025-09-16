import { type MetaFunction } from "react-router";
import { redirect } from "react-router";
import { logout } from "../../services/session.server";
import type { Route } from "./+types/logout";

 const meta: MetaFunction = () => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}

export async function loader({ request }: Route.LoaderArgs) {
  return redirect("/auth/login");
}
