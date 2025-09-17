import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { useState, useEffect } from "react";
import { LeaveRequestModal } from "../modals/leaveReqModal";
import { getUserId } from "~/services/session.server";
import { redirect, useLoaderData } from "react-router";

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

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
    remainingAl: number;
  };
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  updatedAt: string;
};

type LoaderData = {
  token: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getUserId(request);
  if (!token) {
    return redirect("/auth/login");
  } else {
    return { token };
  }
}

export default function Manager() {
  const [leaveData, setLeaveData] = useState<Leave[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const { token } = useLoaderData<LoaderData>();
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeaves = () => {
    fetch(`${API_ENDPOINT}/leave`, {
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

  const handleNewLeave = async (leave: {
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    setModalError("");

    try {
      const res = await fetch(`${API_ENDPOINT}/leave/staff`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leave),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
              ? data.message
              : "Failed to create user. Please check your input.";
        setModalError(errorMessage);
        return;
      }

      await res.json();
      fetchLeaves();
      setShowModal(false);
    } catch (err) {
      setModalError("Network error. Please try again.");
    }
  };

  const updateStatus = (leave: Leave, status: "approved" | "rejected") => {
    fetch(`${API_ENDPOINT}/leave`, {
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
  const filteredData = leaveData.filter(
    (item) =>
      item.user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <>
      <NavBar />
      <div className="app-container">
        <SideBar />
        <main className="main-content">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 p-2 border border-gray-300 rounded"
          />
          <button
            className="btn btn-primary mb-4"
            onClick={() => setShowModal(true)}
            style={{
              position: "absolute",
              right: 0,
              transform: "translateY(-50%)",
            }}
          >
            Create Leave
          </button>
          <LeaveRequestModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleNewLeave}
            error={modalError}
          />

          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">User</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Status</th>
                <th scope="col">Remaining Leave</th>
                <th scope="col">Last updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData
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
                    <td>{leave.user.remainingAl}</td>
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
