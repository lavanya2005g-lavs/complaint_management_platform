import "../styles/cards.css";
import { FaFileAlt, FaSearch, FaUserShield } from "react-icons/fa";

function Cards() {
  return (
    <div className="cards-wrapper">
      <div className="cards-container">

        <div className="feature-card">
          <FaFileAlt />
          <h3>Easy Complaint Submission</h3>
          <p>
            Users can quickly raise complaints related to academic,
            infrastructure, hostel, college, and transport through a structured form.
          </p>
        </div>

        <div className="feature-card">
          <FaSearch />
          <h3>Real-Time Tracking</h3>
          <p>
            Track complaint status using your User ID and stay updated
            with resolution progress instantly.
          </p>
        </div>

        <div className="feature-card">
          <FaUserShield />
          <h3>Admin Management</h3>
          <p>
            Admin dashboard enables efficient monitoring, updating,
            and resolving complaints across departments.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Cards;
