import { Navigate } from "react-router-dom";

function UserProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/Auth" />;
  }

  if (role === "admin") {
    return <Navigate to="/admin-dashboard" />;
  }

  return children;
}

export default UserProtectedRoute;