import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import React, { useEffect, useState } from "react";

export const LeaveCards = () => {
  const [leaveData, setLeaveData] = useState(null);

  useEffect(() => {
    // Replace with your actual API endpoint
    fetch("/api/leave/staff")
      .then((res) => res.json())
      .then((data) => setLeaveData(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <Row xs={1} md={3} className="g-4 comfy">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx}>
            <Card>
              <div className="container">
                <div className="row">
                  <div
                    className="square"
                    style={{
                      backgroundColor: "#9ED1DE",
                      width: "40%",
                      margin: "1rem",
                    }}
                  >
                    <Card.Text className="center-text">
                      This will contain the number of days taken from an
                      endpoint (hopefully the colour as well)
                    </Card.Text>
                  </div>
                  <div
                    className="leave-info"
                    style={{ margin: "1rem", width: "45%" }}
                  >
                    <Card.Text className="center-text">
                      This will contain the leave data i.e. total leave,
                      remaining leave, and used leave
                    </Card.Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </Row>
    </>
  );
};
