const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= ROUTES ================= */
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");      // ✅ CORRECT FILE
const authRoutes = require("./routes/authRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");

app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);       // dashboard routes
app.use("/api/admin", adminAuthRoutes);   // login routes
app.use("/api/auth", authRoutes);

/* ================= TEST ROUTE ================= */
app.get("/", (req, res) => {
  res.send("Complaint API is running 🚀");
});

/* ================= DATABASE CONNECTION ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
  console.log(`🚀 Server running at:${PORT}`);
});
