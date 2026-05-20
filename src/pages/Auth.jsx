import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res = await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            email: formData.email,
            password: formData.password,
          }
        );

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userName", res.data.user?.name || "");
        localStorage.setItem("userEmail", res.data.user?.email || "");

        setMessage("Login Successful 🎉");
        setError("");
        navigate("/raise");

      } else {
        await axios.post(
          "http://localhost:5000/api/auth/register",
          formData
        );

        setMessage("Registration Successful 🎉 Please Login");
        setError("");
        setIsLogin(true);
      }

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setMessage("");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        <h2 className="auth-heading">
          {isLogin ? "Login" : "Register"}
        </h2>

        {message && <div className="success-popup">{message}</div>}
        {error && <div className="error-popup">{error}</div>}

        <form onSubmit={handleSubmit} className="styled-form">

          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              onChange={handleChange}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleChange}
          />

          <button type="submit" className="premium-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="switch-text">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register Now" : " Login Here"}
          </span>
        </p>

      </div>
    </div>
  );
};

export default Auth;
