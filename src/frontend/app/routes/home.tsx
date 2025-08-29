import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { LeaveCards } from "../components/leave_cards";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <>
      <NavBar />
      <SideBar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={collapsed ? "main-content shifted" : "main-content"}>
        <LeaveCards />
      </div>
    </>
  );
}
