const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  department: String,
  complaintType: String,
  description: String,

  category: String,       // ML
  urgency: String,        // ML
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Low",
  },

  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
    default: null,
  },

  duplicateScore: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    default: "Pending"
  },

  assignedDepartment: String,

}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
