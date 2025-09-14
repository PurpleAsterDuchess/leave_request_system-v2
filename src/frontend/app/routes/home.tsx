import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { LeaveCards } from "../components/leave_cards";
import PendingRequestsCard from "~/components/pendingRequestsCard";
import BankHolidaysCard from "~/components/bankHolidaysCard";
import LeaveCalendarCard from "../components/upcomingLeaveCard";

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

          {/* Flex container for the two sections */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "2rem",
              width: "100%",
            }}
          >
            <div style={{ flex: 0.6 }}>
              <PendingRequestsCard />
            </div>

            <div style={{ flex: 0.4, marginRight: "1rem" }}>
              <LeaveCalendarCard />
              <BankHolidaysCard />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
