import { useState } from "react";
import "../Styles/sections.css";

function FAQSection() {

  const [open, setOpen] = useState(null);

  const faqs = [
    {
      question: "How do I raise a complaint?",
      answer: "Login and go to Raise Complaint page."
    },
    {
      question: "Can I track without login?",
      answer: "No. Secure login is required."
    },
    {
      question: "How long resolution takes?",
      answer: "Most complaints resolved within 24-48 hours."
    },
    {
      question: "Is data secure?",
      answer: "Yes. JWT authentication is used."
    },
    {
      question: "Who updates complaint?",
      answer: "Authorized admin updates status."
    },
    {
      question: "Can admin view analytics?",
      answer: "Yes. Admin dashboard provides analytics."
    }
  ];

  return (
    <section className="section dark-section">
      <h2 className="section-title">Frequently Asked Questions</h2>

      <div className="faq-container">
        {faqs.map((item, index) => (
          <div key={index} className="faq-item">

            <div
              className="faq-question"
              onClick={() => setOpen(open === index ? null : index)}
            >
              {item.question}
              <span>{open === index ? "−" : "+"}</span>
            </div>

            {open === index && (
              <div className="faq-answer">
                {item.answer}
              </div>
            )}

          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQSection;