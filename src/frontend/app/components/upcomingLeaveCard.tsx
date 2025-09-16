import React, { useEffect, useState, Suspense, useMemo } from "react";
import Card from "react-bootstrap/Card";
const Calendar = React.lazy(() => import("react-calendar"));
import "react-calendar/dist/Calendar.css";

type LeaveItem = {
  leaveId: number;
  startDate: string;
  endDate: string;
  status: "requested" | "approved" | "rejected";
};

type LeaveDay = {
  date: Date;
  status: LeaveItem["status"];
};

type LoaderData = {
  token: string;
};

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

function LeaveCalendarCard(token: LoaderData) {
  const [leaveData, setLeaveData] = useState<LeaveItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaves = () => {
    fetch(`${API_ENDPOINT}/leave/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch leave data");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data?.data)) {
          const parsed = data.data.map((leave: any) => ({
            leaveId: leave.id,
            startDate: leave.startDate,
            endDate: leave.endDate,
            status: leave.status,
          }));
          setLeaveData(parsed);
        } else {
          setLeaveData([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load leave data.");
      });
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const leaveDates: LeaveDay[] = useMemo(() => {
    const statusPriority = { approved: 3, requested: 2, rejected: 1 };

    const allDays: LeaveDay[] = [];

    leaveData.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDays.push({
          date: new Date(d.getTime()),
          status: leave.status,
        });
      }
    });

    const grouped = new Map<string, LeaveDay>();
    allDays.forEach((day) => {
      const key = day.date.toDateString();
      const existing = grouped.get(key);
      if (
        !existing ||
        statusPriority[day.status] > statusPriority[existing.status]
      ) {
        grouped.set(key, day);
      }
    });

    return Array.from(grouped.values());
  }, [leaveData]);

  if (error) return <p>{error}</p>;
  if (leaveData.length === 0) return <p>Loading leave data...</p>;

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
      <Suspense fallback={<div>Loading calendar...</div>}>
        <Calendar
          tileClassName={({ date }) => {
            const leaveDay = leaveDates.find(
              (leaveDate) =>
                leaveDate.date.toDateString() === date.toDateString()
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
