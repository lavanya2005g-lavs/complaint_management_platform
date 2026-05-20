import React, { useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import "../styles/form.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const TrackComplaint = () => {
  const userName = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const [openComplaintId, setOpenComplaintId] = useState(null);

  const getExpectedDate = (createdAt) => {
    const expected = new Date(createdAt);
    expected.setDate(expected.getDate() + 7);
    return expected;
  };

  const getRemainingLabel = (item) => {
    if (["Resolved", "Completed"].includes(item.status)) {
      return "Completed";
    }

    const now = new Date();
    const expected = getExpectedDate(item.createdAt);
    const diffMs = expected.getTime() - now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.ceil(Math.abs(diffMs) / dayMs);

    if (diffMs < 0) {
      return `${days}d overdue`;
    }

    return `${days}d remaining`;
  };

  const fetchComplaints = async () => {
    if (!userEmail) {
      setError("Please login first to track complaints");
      setComplaints([]);
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/complaints/track?email=${encodeURIComponent(userEmail)}`
      );

      setComplaints(res.data.data || []);
      setOpenComplaintId(null);
      setError("");
    } catch (err) {
      setComplaints([]);
      setError(err.response?.data?.message || "No complaints found for this account");
    } finally {
      setIsLoading(false);
      setHasTracked(true);
    }
  };

  const toggleComplaint = (complaintId) => {
    setOpenComplaintId((prev) => (prev === complaintId ? null : complaintId));
  };

  return (
    <div className="track-page-wrapper">
      <div className="track-card">
        <h2 className="form-heading">Track Complaint</h2>

        <div className="track-action-col">
          <input className="track-user-field" type="text" value={userName} readOnly placeholder="Registered username" />
          <button onClick={fetchComplaints} className="premium-btn" disabled={isLoading}>
            {isLoading ? "Tracking..." : "Track Complaint"}
          </button>
        </div>

        {error && <div className="error-popup">{error}</div>}

        {hasTracked && !error && complaints.length === 0 && (
          <div className="success-popup">No complaints available for this account.</div>
        )}

        {!!complaints.length &&
          complaints.map((comp) => {
            const createdDate = new Date(comp.createdAt);
            const expectedDate = getExpectedDate(comp.createdAt);
            const isCompleted = comp.status === "Completed" || comp.status === "Resolved";
            const isOverdue = !isCompleted && expectedDate < new Date();
            const statusClass =
              isCompleted
                ? "done"
                : expectedDate >= new Date()
                  ? "within"
                  : "overdue";

            const complaintStatusData = {
              labels: ["Pending", "In Progress", "Completed"],
              datasets: [
                {
                  label: "Status",
                  data: [
                    comp.status === "Pending" ? 1 : 0,
                    comp.status === "In Progress" ? 1 : 0,
                    isCompleted ? 1 : 0,
                  ],
                  backgroundColor: ["#f4c430", "#2dd4bf", "#22c55e"],
                  borderRadius: 8,
                },
              ],
            };

            const complaintSlaData = {
              labels: isCompleted ? ["Completed"] : ["Within SLA", "Overdue"],
              datasets: [
                {
                  data: isCompleted ? [1] : [isOverdue ? 0 : 1, isOverdue ? 1 : 0],
                  backgroundColor: isCompleted ? ["#22c55e"] : ["#22c55e", "#f97316"],
                  borderColor: "rgba(18, 58, 76, 0.9)",
                  borderWidth: 1,
                },
              ],
            };

            const complaintChartOptions = {
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  ticks: { color: "#d8f7ff", font: { size: 10 } },
                  grid: { color: "rgba(216, 247, 255, 0.08)" },
                },
                y: {
                  ticks: { color: "#d8f7ff", stepSize: 1, precision: 0 },
                  min: 0,
                  max: 1,
                  grid: { color: "rgba(216, 247, 255, 0.08)" },
                },
              },
            };

            const complaintPieOptions = {
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#d8f7ff",
                    boxWidth: 10,
                    font: { size: 10, weight: "600" },
                  },
                },
              },
            };

            return (
              <div key={comp._id} className="result-card track-result-card">
                <button
                  type="button"
                  className="complaint-dropdown-toggle"
                  onClick={() => toggleComplaint(comp._id)}
                >
                  <span>
                    {comp.complaintType} - {comp.status}
                  </span>
                  <span>{openComplaintId === comp._id ? "-" : "+"}</span>
                </button>

                {openComplaintId === comp._id && (
                  <div className="complaint-dropdown-content">
                    <div className="dropdown-chart-grid">
                      <div className="dropdown-chart-card">
                        <h4>Complaint Status</h4>
                        <div className="dropdown-chart-wrap">
                          <Bar data={complaintStatusData} options={complaintChartOptions} />
                        </div>
                      </div>

                      <div className="dropdown-chart-card">
                        <h4>SLA for this complaint</h4>
                        <div className="dropdown-chart-wrap">
                          <Pie data={complaintSlaData} options={complaintPieOptions} />
                        </div>
                      </div>
                    </div>

                    <div className="track-result-head">
                      <strong>{getRemainingLabel(comp)}</strong>
                    </div>
                    <p><strong>Name:</strong> {comp.userName}</p>
                    <p><strong>Department:</strong> {comp.department}</p>
                    <p><strong>Type:</strong> {comp.complaintType}</p>
                    <p><strong>Description:</strong> {comp.description}</p>
                    <p><strong>Status:</strong> {comp.status}</p>
                    <p><strong>Created:</strong> {createdDate.toLocaleString()}</p>
                    <p><strong>Expected Completion (7 days):</strong> {expectedDate.toLocaleString()}</p>
                    <span className={`track-status-pill ${statusClass}`}>
                      {statusClass === "within"
                        ? "Within 7 days"
                        : statusClass === "overdue"
                          ? "Overdue"
                          : "Completed"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

    </div>
  );
};

export default TrackComplaint;
