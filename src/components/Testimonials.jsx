import React from "react";
import "../Styles/testimonials.css";

function Testimonials() {
  return (
    <section className="testimonials-section">
      <h2 className="section-title">What Users Say</h2>

      <div className="testimonial-container">

        <div className="testimonial-card">
          <p>"Complaint resolution became faster and transparent."</p>
          <h4>— CSE Student</h4>
        </div>

        <div className="testimonial-card">
          <p>"The tracking system is very easy to use."</p>
          <h4>— Hostel Resident</h4>
        </div>

        <div className="testimonial-card">
          <p>"Admin dashboard analytics are extremely helpful."</p>
          <h4>— Department Admin</h4>
        </div>

      </div>
    </section>
  );
}

export default Testimonials;