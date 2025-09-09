import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { useState, useEffect } from "react";
import { LeaveCards } from "~/components/leave_cards";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My leave" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function MyLeave() {
  const [leaveData, setLeaveData] = useState<null | {
    startDate: string;
    endDate: string;
    status: string;
    lastUpdated: string;
  }>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found. User might not be logged in.");
      return;
    }

    fetch("http://localhost:8900/api/leave/staff", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch leave data");
        }
        return res.json();
      })
      .then((data) => {
        if (data?.data?.length > 0) {
          setLeaveData(data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <NavBar />
      <div className="app-container">
        <SideBar />
        <main className="main-content">
          <LeaveCards />
          <button>Create Leave</button>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Status</th>
                <th scope="col">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {leaveData &&
                Array.isArray(leaveData) &&
                leaveData.map((leave, idx) => (
                  <tr key={idx}>
                    <th scope="row">{idx + 1}</th>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.status}</td>
                    <td>{leave.updatedAt}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </main>
      </div>
    </>
  );
}
