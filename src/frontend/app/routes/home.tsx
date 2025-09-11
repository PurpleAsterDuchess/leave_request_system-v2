import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { LeaveCards } from "../components/leave_cards";
import PendingRequestsCard from "~/components/pendingRequestsCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <>
      <NavBar />
      <div className="app-container">
        <SideBar />
        <main className="main-content">
          <LeaveCards />
          <div style={{ width: "60%" }}>
            <PendingRequestsCard />
          </div>
        </main>
      </div>
    </>
  );
}
