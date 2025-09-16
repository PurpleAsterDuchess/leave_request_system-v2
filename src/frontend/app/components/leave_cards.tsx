import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import React, { useEffect, useState } from "react";

type LoaderData = {
  token: string;
};

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

export const LeaveCards = (token:LoaderData) => {
  const [leaveData, setLeaveData] = useState<null | {
    initialAlTotal: number;
    remainingAl: number;
  }>(null);

  const fetchLeaveCards = () => {
    fetch(`${API_ENDPOINT}/leave/staff`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.token}`,
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
          setLeaveData(data.data[0].user);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchLeaveCards();
  }, []);

  if (!leaveData) {
    return <p>Loading leave data...</p>;
  }

  const usedLeave = leaveData.initialAlTotal - leaveData.remainingAl;

  const getRemainingColor = (remaining: number, total: number): string => {
    const percent = (remaining / total) * 100;
    if (percent > 60) return "#C4E17F";
    if (percent > 30) return "#FFD580";
    return "#FF9999"; // Red
  };

  const getUsedColor = (used: number, total: number): string => {
    const percent = (used / total) * 100;
    if (percent < 30) return "#C4E17F";
    if (percent < 70) return "#FFD580";
    return "#FF9999";
  };

  return (
    <Row xs={1} md={2} lg={3} className="g-4 mb-4">
      <Col>
        <Card className="comfy h-100 d-flex flex-row align-items-center p-3">
          <div
            className="square leave-text me-3"
            style={{
              backgroundColor: getUsedColor(
                usedLeave,
                leaveData.initialAlTotal
              ),
            }}
          >
            {usedLeave}
          </div>
          <Card.Text className="leave-label">Used Leave</Card.Text>
        </Card>
      </Col>

      <Col>
        <Card className="comfy h-100 d-flex flex-row align-items-center p-3">
          <div
            className="square leave-text me-3"
            style={{
              backgroundColor: getRemainingColor(
                leaveData.remainingAl,
                leaveData.initialAlTotal
              ),
            }}
          >
            {leaveData.remainingAl}
          </div>
          <Card.Text className="leave-label">Remaining Leave</Card.Text>
        </Card>
      </Col>

      <Col>
        <Card className="comfy h-100 d-flex flex-row align-items-center p-3">
          <div
            className="square leave-text me-3"
            style={{ backgroundColor: "#9ED1DE" }}
          >
            {leaveData.initialAlTotal}
          </div>
          <Card.Text className="leave-label">Total Leave</Card.Text>
        </Card>
      </Col>
    </Row>
  );
};
