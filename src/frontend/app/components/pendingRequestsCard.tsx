import React, { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import Card from "react-bootstrap/Card";

type quickLeaveProps = {
  leaveId: number;
  firstname: string;
  surname: string;
  email: string;
  status: string;
  startDate: string;
  endDate: string;
  initialAlTotal: number;
  remainingAl: number;
};

function PendingRequestsCard() {
  const [leaveData, setLeaveData] = useState<quickLeaveProps[]>([]);

  const fetchPendingLeaves = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return console.error("No token found. User might not be logged in.");
    }

    fetch("http://localhost:8900/api/leave/", {
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
          setLeaveData(
            data.data.map((leave: any) => ({
              leaveId: leave.id,
              firstname: leave.user.firstname,
              surname: leave.user.surname,
              email: leave.user.email,
              status: leave.status,
              startDate: leave.startDate,
              endDate: leave.endDate,
              initialAlTotal: leave.user.initialAlTotal,
              remainingAl: leave.user.remainingAl,
            }))
          );
        }
      })
      .catch((err) => console.error(err));
  };

  const updateStatus = (
    leave: quickLeaveProps,
    status: "approved" | "rejected"
  ) => {
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
      .then(() => fetchPendingLeaves())
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  if (!leaveData) {
    return <p>Loading leave data...</p>;
  }

  return (
    <>
      <>
        <Row className="mb-3">
          <h5 className="mb-3">Pending Requests</h5>
          {leaveData
            .filter((leave) => leave.status === "pending")
            .map((leave, idx) => {
              return (
                <Card
                  key={idx}
                  className="comfy h-100 d-flex flex-row align-items-center p-3"
                >
                  <Col className="me-3">
                    {leave.firstname} {leave.surname}
                  </Col>
                  <Col className="me-3">
                    {leave.startDate} - {leave.endDate}
                  </Col>
                  <Col className="me-3">
                    Initial Leave: {leave.initialAlTotal}
                  </Col>
                  <Col className="me-3">Remaining: {leave.remainingAl}</Col>
                  <Col className="me-3 right-align">
                    <button
                      className="btn btn-success"
                      style={{ marginRight: "5px" }}
                      onClick={() => updateStatus(leave, "approved")}
                    >
                      <img
                        src="/check.png"
                        alt="Approve"
                        width="16"
                        height="16"
                      />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => updateStatus(leave, "rejected")}
                    >
                      <img
                        src="/close.png"
                        alt="Reject"
                        width="16"
                        height="16"
                      />
                    </button>
                  </Col>
                </Card>
              );
            })}
        </Row>
      </>
    </>
  );
}

export default PendingRequestsCard;
