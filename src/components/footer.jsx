import "../Styles/footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div>
          <h3>Intelligent CMS</h3>
          <p>Smart complaint platform powered by MERN & ML.</p>
        </div>

        <div>
          <h4>Contact</h4>
          <p>Email: support@intelligentcms.com</p>
          <p>Phone: +91 9876543210</p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <p>Raise Complaint</p>
          <p>Track Complaint</p>
          <p>Admin Login</p>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 Intelligent CMS. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;