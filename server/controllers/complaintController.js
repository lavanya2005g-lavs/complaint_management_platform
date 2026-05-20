const Complaint = require("../models/Complaint");
const { inferComplaintType } = require("../ml/complaintTypeResolver");

exports.createComplaint = async (req, res) => {
  const { description, complaintType = "", department = "" } = req.body;

  const category = inferComplaintType(description || "", complaintType);

  // Urgency Logic
  let urgency = "Low";
  if (description.includes("urgent") || description.includes("immediately")) {
    urgency = "High";
  } else if (description.includes("soon")) {
    urgency = "Medium";
  }

  const complaint = await Complaint.create({
    ...req.body,
    department: String(department || "").trim(),
    complaintType: category,
    category,
    urgency
  });

  res.json(complaint);
};
