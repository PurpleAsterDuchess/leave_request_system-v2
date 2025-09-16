import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { useState, useEffect } from "react";
import { LeaveCards } from "~/components/leave_cards";
import { LeaveRequestModal } from "../modals/leaveReqModal";
import { getUserId } from "~/services/session.server";
import { redirect } from "react-router";
import { useLoaderData } from "react-router";

type Leave = {
  leaveId: number;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  updatedAt: string;
};

type LoaderData = {
  token: string;
};

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My leave" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getUserId(request);
  if (!token) {
    return redirect("/auth/login");
  } else {
    return { token };
  }
}

export default function MyLeave() {
  const [leaveData, setLeaveData] = useState<Leave[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const { token } = useLoaderData<LoaderData>();

  const fetchLeaves = () => {
    fetch(`${API_ENDPOINT}/leave/staff`, {
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

  const cancelStaffLeave = (leave: Leave) => {
    fetch(`${API_ENDPOINT}/leave/staff`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: leave.leaveId, status: "canceled" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to cancel leave request");
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
          <LeaveCards token={token}/>

          <button
            className="btn btn-primary mb-4"
            onClick={() => setShowModal(true)}
          >
            Request Leave
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
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Status</th>
                <th scope="col">Last updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveData
                .filter((leave) => leave.leaveId !== undefined && leave.leaveId !== null)
                .map((leave, idx) => (
                  <tr key={leave.leaveId}>
                    <th scope="row">{idx + 1}</th>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.status}</td>
                    <td>{leave.updatedAt}</td>
                    <td>
                      {leave.status !== "canceled" && (
                        <button
                          className="btn btn-danger"
                          onClick={() => cancelStaffLeave(leave)}
                        >
                          Cancel
                        </button>
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
