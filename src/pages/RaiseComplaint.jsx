import React, { useState } from "react";
import axios from "axios";
import "../styles/form.css";

const DEPARTMENTS = ["CSE", "IT", "EEE", "ECE", "CIVIL"];

const COMPLAINT_TYPES = [
  "Academic",
  "Infrastructure",
  "Hostel",
  "College",
  "Transport",
];

const RaiseComplaint = () => {
  const storedUserName = localStorage.getItem("userName") || "";
  const storedUserEmail = localStorage.getItem("userEmail") || "";

  const [formData, setFormData] = useState({
    userName: storedUserName,
    userEmail: storedUserEmail,
    department: "",
    complaintType: "",
    description: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/complaints/raise",
        formData
      );

      if (res.data.success) {
        setSuccess(true);
        setError("");
        setFormData({
          userName: storedUserName,
          userEmail: storedUserEmail,
          department: "",
          complaintType: "",
          description: "",
        });
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSuccess(false);
    }
  };

 return (
  <div className="page-wrapper">
    <div className="form-card">

      <h2 className="form-heading">Raise Complaint</h2>

      {success && (
        <div className="success-popup">
          🎉 Thank You! Your complaint has been submitted successfully.
        </div>
      )}

      {error && (
        <div className="error-popup">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="styled-form">

        <div className="input-group">
          <input
            type="text"
            name="userName"
            placeholder="Registered Name"
            value={formData.userName}
            onChange={handleChange}
            readOnly
            required
          />
        </div>

        <div className="input-group">
          <input
            type="email"
            name="userEmail"
            placeholder="Registered Email"
            value={formData.userEmail}
            onChange={handleChange}
            readOnly
            required
          />
        </div>

        <div className="input-group">
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <select
            name="complaintType"
            value={formData.complaintType}
            onChange={handleChange}
            required
          >
            <option value="">Select Complaint Type</option>
            {COMPLAINT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <textarea
            name="description"
            placeholder="Describe your complaint"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="premium-btn">
          Submit Complaint
        </button>

      </form>
    </div>
  </div>
);
}

export default RaiseComplaint;