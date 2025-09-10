import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { useState, useEffect } from "react";
import { LeaveCards } from "~/components/leave_cards";
import { LeaveRequestModal } from "../modals/leaveReqModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Team leave" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

type Leave = {
  leaveId: number;
  user: {
    firstname: string;
    surname: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  updatedAt: string;
};

export default function Manager() {
  const [leaveData, setLeaveData] = useState<Leave[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchLeaves = () => {
    const token = localStorage.getItem("token");
    if (!token)
      return console.error("No token found. User might not be logged in.");

    fetch("http://localhost:8900/api/leave", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch leave data");
        return res.json();
      })
      .then((data) => {
        setLeaveData(data?.data || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleNewLeave = (leave: {
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:8900/api/leave", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leave),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create leave request");
        return res.json();
      })
      .then(() => fetchLeaves())
      .catch((err) => console.error(err));
  };

  const updateStatus = (leave: Leave, status: "approved" | "rejected") => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:8900/api/leave", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: leave.leaveId, status: status }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to change leave request status");
        return res.json();
      })
      .then(() => fetchLeaves())
      .catch((err) => console.error(err));
  };

  return (
    <>
      <NavBar />
      <div className="app-container">
        <SideBar />
        <main className="main-content">
          <button
            className="btn btn-primary mb-4"
            onClick={() => setShowModal(true)}
          >
            Create Leave
          </button>

          <LeaveRequestModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleNewLeave}
          />

          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">User</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Status</th>
                <th scope="col">Last updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveData
                .filter(
                  (leave) =>
                    leave.leaveId !== undefined && leave.leaveId !== null
                )
                .map((leave, idx) => (
                  <tr key={leave.leaveId}>
                    <th scope="row">{idx + 1}</th>
                    <td data-toggle="tooltip" title={`${leave.user.email}`}>
                      {leave.user.firstname} {leave.user.surname}
                    </td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.status}</td>
                    <td>{leave.updatedAt}</td>
                    <td>
                      {leave.status == "pending" && (
                        <>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => updateStatus(leave, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => updateStatus(leave, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </main>
      </div>
    </>
  );
}
