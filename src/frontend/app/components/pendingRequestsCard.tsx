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

type LoaderData = {
  token: string;
};

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

function PendingRequestsCard(token: LoaderData) {
  const [leaveData, setLeaveData] = useState<quickLeaveProps[]>([]);

  const fetchPendingLeaves = async () => {

    try {
      const res = await fetch(`${API_ENDPOINT}/leave/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch leave data");
      const data = await res.json();

      if (Array.isArray(data?.data)) {
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
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (
    leave: quickLeaveProps,
    status: "approved" | "rejected"
  ) => {
    try {
      const res = await fetch(`${API_ENDPOINT}/leave/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: leave.leaveId, status }),
      });

      if (!res.ok) throw new Error("Failed to change leave request status");
      await res.json();
      fetchPendingLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const pendingLeaves = leaveData.filter((leave) => leave.status === "pending");

  if (pendingLeaves.length === 0) {
    return <p>No Pending Requests</p>;
  }

  return (
    <Row className="mb-3">
      <h5 className="mb-3">Pending Requests</h5>
      {pendingLeaves.map((leave) => (
        <Card
          key={leave.leaveId}
          className="comfy h-100 d-flex flex-row align-items-center p-3"
        >
          <Col className="me-3">
            {leave.firstname} {leave.surname}
          </Col>
          <Col className="me-3">
            {leave.startDate} - {leave.endDate}
          </Col>
          <Col className="me-3">Initial Leave: {leave.initialAlTotal}</Col>
          <Col className="me-3">Remaining: {leave.remainingAl}</Col>
          <Col className="me-3 right-align">
            <button
              className="btn btn-success"
              style={{ marginRight: "5px" }}
              onClick={() => updateStatus(leave, "approved")}
            >
              <img src="/check.png" alt="Approve" width="16" height="16" />
            </button>
            <button
              className="btn btn-danger"
              onClick={() => updateStatus(leave, "rejected")}
            >
              <img src="/close.png" alt="Reject" width="16" height="16" />
            </button>
          </Col>
        </Card>
      ))}
    </Row>
  );
}

export default PendingRequestsCard;
