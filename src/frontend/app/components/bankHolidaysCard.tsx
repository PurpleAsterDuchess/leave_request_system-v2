import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HolidayItem = {
  title: string;
  date: string;
};

function BankHolidaysCard() {
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchHolidays = async () => {
    try {
      const res = await fetch("https://www.gov.uk/bank-holidays.json");
      if (!res.ok) throw new Error("Failed to fetch bank holidays");

      const data = await res.json();

      const region = data["england-and-wales"];
      if (!region || !region.events) {
        throw new Error("No holidays found for region");
      }

      const mapped: HolidayItem[] = region.events.map((ev: any) => ({
        title: ev.title,
        date: ev.date,
      }));

      // sort by date ascending
      const sorted = mapped.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      setHolidays(sorted);

      // find the first upcoming holiday
      const today = new Date();
      const upcomingIndex = sorted.findIndex((h) => new Date(h.date) >= today);

      setCurrentIndex(upcomingIndex >= 0 ? upcomingIndex : sorted.length - 1);
    } catch (err) {
      console.error("Error fetching bank holidays:", err);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  if (holidays.length === 0) {
    return <p>Loading bank holidays...</p>;
  }

  const current = holidays[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < holidays.length - 1 ? prev + 1 : prev));
  };

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{
            background: "none",
            border: "none",
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            color: currentIndex === 0 ? "#ccc" : "#4a4aff",
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: "500", color: "#444" }}>Bank Holidays</span>
        <button
          onClick={handleNext}
          disabled={currentIndex === holidays.length - 1}
          style={{
            background: "none",
            border: "none",
            cursor:
              currentIndex === holidays.length - 1 ? "not-allowed" : "pointer",
            color: currentIndex === holidays.length - 1 ? "#ccc" : "#4a4aff",
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem" }}>
        <h5 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
          {current.title}
        </h5>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
          {new Date(current.date).toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </Card>
  );
}

export default BankHolidaysCard;
