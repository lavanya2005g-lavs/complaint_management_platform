import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/cards.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COMPLAINT_TYPE_CONFIG = [
  { key: "all", label: "All Complaints" },
  { key: "Academic", label: "Academic" },
  { key: "Transport", label: "Transport" },
  { key: "Hostel", label: "Hostel" },
  { key: "College", label: "College" },
  { key: "Infrastructure", label: "Infrastructure" },
];

const DEPARTMENTS = ["CSE", "IT", "EEE", "ECE", "CIVIL"];

const PRIORITY_AND_DUPLICATE_FILTERS = [
  { key: "High", label: "High" },
  { key: "Medium", label: "Medium" },
  { key: "Low", label: "Low" },
  { key: "DuplicateMerge", label: "Duplicate & Merge" },
];

function derivePriority(complaint) {
  const type = (complaint.complaintType || "").toLowerCase();
  if (type === "academic" || type === "transport") {
    return "High";
  }

  if (type === "hostel" || type === "college") {
    return "Medium";
  }

  if (type === "infrastructure") {
    return "Low";
  }

  return complaint.priority || "Low";
}

function isCompletedStatus(status) {
  return status === "Completed" || status === "Resolved";
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilterGroup, setActiveFilterGroup] = useState("type");
  const [activeFilterValue, setActiveFilterValue] = useState("all");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [userSearchText, setUserSearchText] = useState("");

  const adminToken = localStorage.getItem("adminToken");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  };

  const loadDashboard = async () => {
    const [dashboardRes, complaintsRes] = await Promise.all([
      axios.get("http://localhost:5000/api/admin/dashboard", authHeaders),
      axios.get("http://localhost:5000/api/admin/complaints", authHeaders),
    ]);

    setDashboard(dashboardRes.data);
    setComplaints(complaintsRes.data.complaints || []);
  };

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      await loadDashboard();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin");
      return;
    }

    loadDashboard()
      .catch(() => {
        navigate("/admin");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const userOptions = useMemo(() => {
    const map = new Map();

    complaints.forEach((complaint) => {
      const email = (complaint.userEmail || "").toLowerCase();
      if (!email) {
        return;
      }

      if (!map.has(email)) {
        map.set(email, {
          email,
          name: complaint.userName,
          count: 0,
        });
      }

      const existing = map.get(email);
      existing.count += 1;
      map.set(email, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [complaints]);

  useEffect(() => {
    if (!selectedUserEmail && userOptions.length) {
      setSelectedUserEmail(userOptions[0].email);
    }
  }, [userOptions, selectedUserEmail]);

  useEffect(() => {
    if (!complaints.length) {
      return;
    }

    if (activeFilterGroup === "type" && activeFilterValue === "Academic") {
      setActiveFilterValue("all");
    }
  }, [complaints, activeFilterGroup, activeFilterValue]);

  const normalizedComplaints = useMemo(() => {
    return complaints.map((complaint) => ({
      ...complaint,
      normalizedType: (complaint.complaintType || complaint.category || "General").trim().toLowerCase(),
      normalizedDepartment: (complaint.department || "").trim().toLowerCase(),
      normalizedStatus: (complaint.status || "").trim().toLowerCase(),
      effectivePriority: derivePriority(complaint),
      normalizedPriority: derivePriority(complaint).toLowerCase(),
    }));
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const duplicateRootIds = new Set(
      normalizedComplaints
        .filter((item) => Boolean(item.duplicateOf?._id))
        .map((item) => item.duplicateOf._id)
    );

    const duplicateGroupIds = new Set();
    normalizedComplaints.forEach((item) => {
      if (item.duplicateOf?._id) {
        duplicateGroupIds.add(item._id);
        duplicateGroupIds.add(item.duplicateOf._id);
      }

      if (duplicateRootIds.has(item._id)) {
        duplicateGroupIds.add(item._id);
      }
    });

    return normalizedComplaints.filter((complaint) => {
      if (activeFilterGroup === "type") {
        if (activeFilterValue === "all") {
          return true;
        }

        return complaint.normalizedType === activeFilterValue.toLowerCase();
      }

      if (activeFilterGroup === "department") {
        return complaint.normalizedDepartment === activeFilterValue.toLowerCase();
      }

      if (activeFilterGroup === "priority-dup") {
        if (activeFilterValue === "DuplicateMerge") {
          return duplicateGroupIds.has(complaint._id);
        }

        return complaint.normalizedPriority === activeFilterValue.toLowerCase();
      }

      if (activeFilterGroup === "user") {
        return (complaint.userEmail || "").toLowerCase() === activeFilterValue.toLowerCase();
      }

      return true;
    });
  }, [normalizedComplaints, activeFilterGroup, activeFilterValue]);

  const filteredPriorityCounts = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    filteredComplaints.forEach((complaint) => {
      const priority = complaint.effectivePriority;
      if (counts[priority] !== undefined) {
        counts[priority] += 1;
      }
    });
    return counts;
  }, [filteredComplaints]);

  const globalPriorityCounts = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    normalizedComplaints.forEach((complaint) => {
      const p = complaint.effectivePriority;
      if (counts[p] !== undefined) {
        counts[p] += 1;
      }
    });
    return counts;
  }, [normalizedComplaints]);

  const duplicateMergeCount = useMemo(() => {
    const ids = new Set();
    normalizedComplaints.forEach((complaint) => {
      if (complaint.duplicateOf?._id) {
        ids.add(complaint._id);
        ids.add(complaint.duplicateOf._id);
      }
    });
    return ids.size;
  }, [normalizedComplaints]);

  const totalDuplicateComplaints = normalizedComplaints.filter(
    (complaint) => complaint.status === "Duplicate"
  ).length;

  const activeFilterLabel = useMemo(() => {
    if (activeFilterGroup === "type") {
      const match = COMPLAINT_TYPE_CONFIG.find((item) => item.key === activeFilterValue);
      return match ? match.label : activeFilterValue;
    }

    if (activeFilterGroup === "department") {
      return activeFilterValue;
    }

    if (activeFilterGroup === "priority-dup") {
      const match = PRIORITY_AND_DUPLICATE_FILTERS.find((item) => item.key === activeFilterValue);
      return match ? match.label : activeFilterValue;
    }

    if (activeFilterGroup === "user") {
      return userOptions.find((user) => user.email === activeFilterValue)?.name || activeFilterValue;
    }

    return activeFilterValue;
  }, [activeFilterGroup, activeFilterValue, userOptions]);

  const filteredPriorityChartData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        label: "Complaints",
        data: [
          globalPriorityCounts.High,
          globalPriorityCounts.Medium,
          globalPriorityCounts.Low,
        ],
        backgroundColor: ["#f43f5e", "#f59e0b", "#10b981"],
        borderRadius: 8,
      },
    ],
  };

  const filteredPriorityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#d9f8ff",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#d9f8ff" },
        grid: { color: "rgba(87,188,212,0.16)" },
      },
      y: {
        ticks: { color: "#d9f8ff", precision: 0 },
        grid: { color: "rgba(87,188,212,0.16)" },
      },
    },
  };

  const barValuePlugin = {
    id: "barValuePlugin",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const datasetMeta = chart.getDatasetMeta(0);
      const values = chart.data.datasets[0].data;

      datasetMeta.data.forEach((bar, index) => {
        const value = values[index];
        ctx.save();
        ctx.fillStyle = "#d9f8ff";
        ctx.font = "bold 12px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(String(value), bar.x, bar.y - 8);
        ctx.restore();
      });
    },
  };

  const searchedUsers = useMemo(() => {
    const q = userSearchText.trim().toLowerCase();
    if (!q) {
      return userOptions;
    }

    return userOptions.filter((user) =>
      (user.name || "").toLowerCase().includes(q)
    );
  }, [userOptions, userSearchText]);

  const handleStatusChange = async (complaintId, status) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/complaints/${complaintId}`,
        { status },
        authHeaders
      );
      await refreshDashboard();
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  const handleMergeDuplicates = async () => {
    setActionLoading(true);
    try {
      await axios.post("http://localhost:5000/api/admin/merge-duplicates", {}, authHeaders);
      await refreshDashboard();
    } catch (error) {
      console.error("Duplicate merge failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserEmail) {
      return;
    }

    const confirmed = window.confirm(
      "Delete selected user and all related complaints?"
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/users/${encodeURIComponent(selectedUserEmail)}`,
        authHeaders
      );
      setSelectedUserEmail("");
      await refreshDashboard();
    } catch (error) {
      console.error("Delete user failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  if (loading || !dashboard) {
    return (
      <div className="loading-container">
        <div className="loader" />
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-v2">
      <button className="logout-btn" onClick={handleLogout}>Logout</button>

      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Review all complaint classifications, priority levels, and duplicate flow in one place</p>
      </div>

      <div className="dashboard-summary-strip">
        <div className="summary-chip"><strong>Total Users:</strong> {dashboard.totalUsers}</div>
        <div className="summary-chip"><strong>Total Complaints:</strong> {dashboard.total}</div>
        <div className="summary-chip"><strong>Duplicates:</strong> {totalDuplicateComplaints}</div>
        <div className="summary-chip"><strong>High Priority:</strong> {dashboard.highPriority}</div>
        <div className="summary-chip"><strong>Medium Priority:</strong> {dashboard.mediumPriority}</div>
        <div className="summary-chip"><strong>Low Priority:</strong> {dashboard.lowPriority}</div>
      </div>

      <div className="admin-filter-cards-grid">
        <div className="filter-card">
          <h3>Complaint Type</h3>
          <div className="filter-list">
            {COMPLAINT_TYPE_CONFIG.map((item) => {
              const isActive =
                activeFilterGroup === "type" && activeFilterValue === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  data-filter-key={item.key}
                  className={`filter-list-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveFilterGroup("type");
                    setActiveFilterValue(item.key);
                  }}
                >
                  <span>{item.label}</span>
                  <span className="item-meta">+</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-card">
          <h3>Department</h3>
          <div className="filter-list">
            {DEPARTMENTS.map((dept) => {
              const isActive =
                activeFilterGroup === "department" && activeFilterValue === dept;

              return (
                <button
                  key={dept}
                  type="button"
                  className={`filter-list-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveFilterGroup("department");
                    setActiveFilterValue(dept);
                  }}
                >
                  <span>{dept}</span>
                  <span className="item-meta">+</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-card">
          <h3>Priority & Duplicate</h3>
          <div className="filter-list">
            {PRIORITY_AND_DUPLICATE_FILTERS.map((item) => {
              const isActive =
                activeFilterGroup === "priority-dup" && activeFilterValue === item.key;

              let count = 0;
              if (item.key === "DuplicateMerge") {
                count = duplicateMergeCount;
              } else if (item.key === "High") {
                count = globalPriorityCounts.High;
              } else if (item.key === "Medium") {
                count = globalPriorityCounts.Medium;
              } else if (item.key === "Low") {
                count = globalPriorityCounts.Low;
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`filter-list-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveFilterGroup("priority-dup");
                    setActiveFilterValue(item.key);
                  }}
                >
                  <span>{item.label}</span>
                  <span className="item-meta">{count}</span>
                </button>
              );
            })}
          </div>

          <button
            className="merge-btn full-width"
            onClick={handleMergeDuplicates}
            disabled={actionLoading}
          >
            {actionLoading ? "Merging..." : "Detect & Merge Duplicate"}
          </button>
        </div>
      </div>

      <div className="results-panel">
        <div className="results-head">
          <h3>Showing: {activeFilterLabel} ({filteredComplaints.length})</h3>
        </div>

        <div className="results-split-layout">
          <div className="complaints-grid compact-grid details-grid">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint._id}
                className={`admin-complaint-card ${complaint.status === "Duplicate" ? "duplicate-card" : ""}`}
              >
                <div className="card-head">
                  <h3>{complaint.complaintType || complaint.category || "General"}</h3>
                  <span className={`status-chip status-${String(complaint.status).toLowerCase().replace(/\s+/g, "-")}`}>
                    {complaint.status}
                  </span>
                </div>

                <div className="complaint-details static-details">
                  <p><strong>User:</strong> {complaint.userName}</p>
                  <p><strong>Email:</strong> {complaint.userEmail}</p>
                  <p><strong>Department:</strong> {complaint.department}</p>
                  <p><strong>Classification:</strong> {complaint.category || complaint.complaintType || "General"}</p>
                  <p><strong>Description:</strong> {complaint.description}</p>
                  <p><strong>Priority:</strong> <span className="priority-pill">{complaint.effectivePriority}</span></p>
                  <p><strong>Created:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>

                  {complaint.status === "Duplicate" && complaint.duplicateOf && (
                    <p className="dup-note">
                      Duplicate complaint (similarity: {(complaint.duplicateScore || 0).toFixed(2)})
                    </p>
                  )}

                  {complaint.duplicateOf && (
                    <p className="dup-note">
                      Merged with: {complaint.duplicateOf.complaintType || complaint.duplicateOf.category || "Original complaint"}
                    </p>
                  )}

                  <div className="status-row">
                    <label htmlFor={`status-${complaint._id}`}>Status:</label>
                    <select
                      id={`status-${complaint._id}`}
                      value={isCompletedStatus(complaint.status) ? "Completed" : complaint.status}
                      onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Duplicate">Duplicate</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {filteredComplaints.length === 0 && (
              <div className="empty-state">No complaints found for {activeFilterLabel}.</div>
            )}
          </div>

          <div className="results-chart-card">
            <h4>Priority Distribution (All Complaints)</h4>
            <div className="results-chart-wrap">
              <Bar
                data={filteredPriorityChartData}
                options={filteredPriorityChartOptions}
                plugins={[barValuePlugin]}
              />
            </div>

            <div className="admin-user-control-card">
              <h4>Total Users: {dashboard.totalUsers}</h4>
              <input
                type="text"
                className="user-search-input"
                placeholder="Search user name..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
              />

              <div className="user-search-results">
                {searchedUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    className={`user-search-item ${selectedUserEmail === user.email ? "active" : ""}`}
                    onClick={() => {
                      setSelectedUserEmail(user.email);
                      setActiveFilterGroup("user");
                      setActiveFilterValue(user.email);
                    }}
                  >
                    <span>{user.name}</span>
                    <span>{user.count}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="delete-user-btn full-width"
                onClick={handleDeleteUser}
                disabled={actionLoading || !selectedUserEmail}
              >
                {actionLoading ? "Processing..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
