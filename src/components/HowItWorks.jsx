import "../Styles/sections.css";

function HowItWorks() {
  return (
    <section className="section dark-section">
      <h2 className="section-title">How It Works</h2>

      <div className="steps-container">
        <div className="step-card">
          <h3>Login Securely</h3>
          <p>Users login using secure authentication.</p>
        </div>

        <div className="step-card">
          <h3>Raise Complaint</h3>
          <p>Submit complaint with department and description.</p>
        </div>

        <div className="step-card">
          <h3>Track Status</h3>
          <p>Track complaint status in real-time.</p>
        </div>

        <div className="step-card">
          <h3>Admin Resolution</h3>
          <p>Admin reviews and resolves efficiently.</p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;