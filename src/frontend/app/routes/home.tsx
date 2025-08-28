import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import LeaveCards from "~/components/leave_cards";
import { TestComponent } from "../components/test_component";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <>
      <TestComponent />
      <NavBar />
      <SideBar />
      <LeaveCards />
    </>
  );
}
