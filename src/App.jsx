import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import RaiseComplaint from "./pages/RaiseComplaint.jsx";
import TrackComplaint from "./pages/TrackComplaint.jsx";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserProtectedRoute from "./components/UserProtectedRoute";
import Chatbot from "./components/Chatbot";

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <Chatbot />}

      <Routes>

        <Route path="/" element={<Home />} />

        {/* Protected User Routes */}
        <Route
          path="/raise"
          element={
            <UserProtectedRoute>
              <RaiseComplaint />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/track"
          element={
            <UserProtectedRoute>
              <TrackComplaint />
            </UserProtectedRoute>
          }
        />

          <Route path="/Auth" element={<Auth />} />
          <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-login" element={<Navigate to="/admin" replace />} />

        {/* Admin Protected Route */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }

          
        />
        

      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;