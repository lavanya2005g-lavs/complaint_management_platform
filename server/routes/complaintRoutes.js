const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const { predictPriority } = require("../ml/priorityPredictor");
const { getBestDuplicateMatch } = require("../ml/textSimilarity");
const { inferComplaintType, normalizeComplaintType } = require("../ml/complaintTypeResolver");

const ALLOWED_DEPARTMENTS = ["CSE", "IT", "EEE", "ECE", "CIVIL"];
const ALLOWED_COMPLAINT_TYPES = [
  "Academic",
  "Infrastructure",
  "Hostel",
  "College",
  "Transport",
];

function normalizeAllowedValue(value, allowedValues) {
  const normalizedValue = (value || "").trim().toLowerCase();
  return allowedValues.find(
    (allowedValue) => allowedValue.toLowerCase() === normalizedValue
  );
}

// CREATE COMPLAINT
router.post("/raise", async (req, res) => {
  try {
    const {
      userName,
      userEmail,
      department,
      complaintType,
      description,
    } = req.body;

    if (!userName || !userEmail || !department || !complaintType || !description) {
      return res.status(400).json({
        success: false,
        message: "All complaint fields are required",
      });
    }

    const normalizedDepartment = normalizeAllowedValue(
      department,
      ALLOWED_DEPARTMENTS
    );
    const normalizedComplaintType = normalizeAllowedValue(
      complaintType,
      ALLOWED_COMPLAINT_TYPES
    );

    if (!normalizedDepartment) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid department",
      });
    }

    if (!normalizedComplaintType) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid complaint type",
      });
    }

    const normalizedDescription = description.toLowerCase();
    const inferredComplaintType = inferComplaintType(
      normalizedDescription,
      normalizedComplaintType
    );
    const complaintTypeForSave = normalizeComplaintType(inferredComplaintType) || normalizedComplaintType;
    const category = complaintTypeForSave;
    const priority = predictPriority(normalizedDescription, complaintTypeForSave);

    let urgency = "Low";
    if (
      normalizedDescription.includes("urgent") ||
      normalizedDescription.includes("immediately")
    ) {
      urgency = "High";
    } else if (normalizedDescription.includes("soon")) {
      urgency = "Medium";
    }

    const existingComplaints = await Complaint.find({
      status: { $ne: "Duplicate" },
      duplicateOf: null,
    })
      .sort({ createdAt: -1 })
      .limit(250);

    const sameTypeComplaints = existingComplaints.filter(
      (item) =>
        (item.complaintType || "").toLowerCase().trim() ===
        complaintTypeForSave.toLowerCase()
    );

    const duplicateMatch = sameTypeComplaints.length
      ? getBestDuplicateMatch(
          normalizedDescription,
          sameTypeComplaints,
          0.45,
          complaintTypeForSave
        )
      : null;

    const isDuplicate = Boolean(duplicateMatch);

    const newComplaint = new Complaint({
      userName,
      userEmail: userEmail.toLowerCase(),
      department: normalizedDepartment,
      complaintType: complaintTypeForSave,
      description,
      category,
      urgency,
      priority,
      status: isDuplicate ? "Duplicate" : "Pending",
      duplicateOf: isDuplicate ? duplicateMatch.complaint._id : null,
      duplicateScore: isDuplicate ? Number(duplicateMatch.score.toFixed(3)) : 0,
    });
    const savedComplaint = await newComplaint.save();

    res.status(201).json({
      success: true,
      message: isDuplicate
        ? "Complaint matched with an existing issue and marked as duplicate"
        : "Complaint submitted successfully",
      data: savedComplaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TRACK COMPLAINT BY EMAIL
router.get("/track", async (req, res) => {
  try {
    const email = (req.query.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const complaints = await Complaint.find({
      userEmail: email,
    }).sort({ createdAt: -1 });

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No complaints found for this account",
      });
    }

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
