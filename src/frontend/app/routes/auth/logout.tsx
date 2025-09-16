import { type MetaFunction, redirect } from "react-router";
import { logout } from "../../services/session.server";
import type { Route } from "./+types/logout";

export const meta: MetaFunction = () => {
  return [
    { title: "Logout" },
    { name: "description", content: "Logging you out..." },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  return logout(request);
}

export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}
