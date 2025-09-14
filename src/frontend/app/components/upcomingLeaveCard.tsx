import React, { useEffect, useState, Suspense } from "react";
import Card from "react-bootstrap/Card";
const Calendar = React.lazy(() => import("react-calendar"));
import "react-calendar/dist/Calendar.css";

type LeaveItem = {
  leaveId: number;
  startDate: string;
  endDate: string;
  status: string;
};

function LeaveCalendarCard() {
  const [leaveData, setLeaveData] = useState<LeaveItem[]>([]);

  const fetchLeaves = () => {
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
        if (!res.ok) throw new Error("Failed to fetch leave data");
        return res.json();
      })
      .then((data) => {
        if (data?.data?.length > 0) {
          setLeaveData(
            data.data.map((leave: any) => ({
              leaveId: leave.id,
              startDate: leave.startDate,
              endDate: leave.endDate,
              status: leave.status,
            }))
          );
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const leaveDates = leaveData.flatMap((leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const days: { date: Date; status: string }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({ date: new Date(d), status: leave.status });
    }
    return days;
  });

  return (
    <Card
      style={{
        borderRadius: "8px",
        textAlign: "center",
        maxWidth: "400px",
        margin: "0 auto",
        padding: "1rem",
      }}
    >
      <h5 style={{ marginBottom: "1rem", fontWeight: "600" }}>My Leave</h5>
      <Suspense fallback={<div>Loading...</div>}>
      <Calendar
        tileClassName={({ date }) => {
          const leaveDay = leaveDates.find(
            (leaveDate) => leaveDate.date.toDateString() === date.toDateString()
          );

          if (!leaveDay) return "";

          if (leaveDay.status === "requested") return "leave-requested";
          if (leaveDay.status === "approved") return "leave-approved";
          if (leaveDay.status === "rejected") return "leave-rejected";

          return "";
        }}
      />
      </Suspense>
    </Card>
  );
}

export default LeaveCalendarCard;
