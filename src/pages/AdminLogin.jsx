import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/form.css";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/login",
        { email, password }
      );

      console.log("Login Response:", res.data);

      // Store token
      localStorage.setItem("adminToken", res.data.token);

      // Redirect
      navigate("/admin-dashboard");

    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="form-card">
        <h2 className="form-heading">Admin Portal Access</h2>

        <form onSubmit={handleLogin} className="styled-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="premium-btn">
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;