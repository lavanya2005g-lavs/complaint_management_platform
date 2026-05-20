import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);

  // Get role from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setRole(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">Intelligent CMS</div>

      <div className="nav-links">
        <Link className={location.pathname === "/" ? "active" : ""} to="/">
          Home
        </Link>

        <Link className={location.pathname === "/raise" ? "active" : ""} to="/raise">
          Raise Complaint
        </Link>

        <Link className={location.pathname === "/track" ? "active" : ""} to="/track">
          Track Complaint
        </Link>

        {!role && (
          <Link className={location.pathname === "/Auth" ? "active" : ""} to="/Auth">
            Login
          </Link>
        )}

        {role === "admin" && (
          <Link className={location.pathname === "/AdminDashboard" ? "active" : ""} to="/AdminDashboard">
            Admin Dashboard
          </Link>
        )}

        {role && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
