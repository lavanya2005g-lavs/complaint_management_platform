import React, { useState } from "react";
import "../styles/chatbot.css";

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi 👋 How can I help you?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    let botReply = { text: "Please raise or track your complaint from the menu.", sender: "bot" };

    if (input.toLowerCase().includes("raise")) {
      botReply.text = "Click on 'Raise Complaint' in navbar to submit your issue.";
    } else if (input.toLowerCase().includes("track")) {
      botReply.text = "Open Track Complaint and click the track button to view your complaint updates.";
    } else if (input.toLowerCase().includes("admin")) {
      botReply.text = "Open /admin to access admin login.";
    }

    setMessages([...messages, userMessage, botReply]);
    setInput("");
  };

  return (
    <>
      <div className={`chat-window ${open ? "active" : ""}`}>
        <div className="chat-header">
          Intelligent CMS Bot
          <span onClick={() => setOpen(false)}>✖</span>
        </div>

        <div className="chat-body">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={handleSend}>➤</button>
        </div>
      </div>

      <div className="chat-toggle" onClick={() => setOpen(!open)}>
        💬
      </div>
    </>
  );
}

export default Chatbot;