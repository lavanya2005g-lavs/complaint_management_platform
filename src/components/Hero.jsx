import { useNavigate } from "react-router-dom";
import "../styles/hero.css";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      <div className="hero-content">
        <h1>Intelligent Complaint Management Platform</h1>

        <p>
          A MERN-based smart complaint platform with Machine Learning
          classification, analytics dashboard, and transparent resolution
          tracking system.
        </p>

        <div className="hero-buttons">
          <button onClick={() => navigate("/raise")}>
            Raise Complaint
          </button>

          <button
            className="outline"
            onClick={() => navigate("/track")}
          >
            Track Complaint
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hero;
