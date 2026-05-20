import "../Styles/sections.css";

function StatsSection() {
  return (
    <section className="section light-section">
      <div className="stats-container">

        <div className="stat-box">
          <h2>1200+</h2>
          <p>Complaints Raised</p>
        </div>

        <div className="stat-box">
          <h2>95%</h2>
          <p>Resolved</p>
        </div>

        <div className="stat-box">
          <h2>24 hrs</h2>
          <p>Avg Resolution</p>
        </div>

      </div>
    </section>
  );
}

export default StatsSection;