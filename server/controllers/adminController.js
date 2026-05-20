const Complaint = require("../models/Complaint");
const User = require("../models/User");
const { getBestDuplicateMatch } = require("../ml/textSimilarity");
const { predictPriority } = require("../ml/priorityPredictor");
const { inferComplaintType } = require("../ml/complaintTypeResolver");

function isCompletedStatus(status) {
  return status === "Completed" || status === "Resolved";
}

exports.getDashboardData = async (req, res) => {
  try {
    // Get all complaints regardless of type
    const complaints = await Complaint.find({}).lean();

    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "Pending").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const completed = complaints.filter((c) => isCompletedStatus(c.status)).length;
    const duplicate = complaints.filter((c) => Boolean(c.duplicateOf)).length;

    const totalUsers = await User.countDocuments({ role: "user" });

    const highPriority = complaints.filter(
      (c) => predictPriority(c.description || "", c.complaintType || "") === "High"
    ).length;
    const mediumPriority = complaints.filter(
      (c) => predictPriority(c.description || "", c.complaintType || "") === "Medium"
    ).length;
    const lowPriority = complaints.filter(
      (c) => predictPriority(c.description || "", c.complaintType || "") === "Low"
    ).length;

    const now = new Date();
    let withinSla = 0;
    let overdue = 0;

    complaints.forEach((complaint) => {
      if (isCompletedStatus(complaint.status) || complaint.status === "Duplicate") {
        return;
      }

      const expected = new Date(complaint.createdAt);
      expected.setDate(expected.getDate() + 7);

      if (expected >= now) {
        withinSla += 1;
      } else {
        overdue += 1;
      }
    });

    res.json({
      total,
      pending,
      inProgress,
      completed,
      duplicate,
      totalUsers,
      highPriority,
      mediumPriority,
      lowPriority,
      sla: {
        withinSla,
        overdue,
        completed,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    // Get all complaints regardless of type
    const complaints = await Complaint.find({})
      .populate("duplicateOf", "_id complaintType status")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Pending", "In Progress", "Completed", "Duplicate"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const rootId = complaint.duplicateOf || complaint._id;

    await Complaint.updateMany(
      {
        $or: [{ _id: rootId }, { duplicateOf: rootId }],
      },
      { $set: { status } }
    );

    const updatedRoot = await Complaint.findById(rootId);

    res.json({ success: true, complaint: updatedRoot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

exports.mergeSimilarComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: { $nin: ["Completed", "Resolved"] },
      duplicateOf: null,
    }).sort({ createdAt: 1 });

    let mergedCount = 0;

    for (let i = 0; i < complaints.length; i += 1) {
      const master = complaints[i];

      for (let j = i + 1; j < complaints.length; j += 1) {
        const candidate = complaints[j];

        if (candidate.duplicateOf) {
          continue;
        }

        const candidateType = inferComplaintType(
          candidate.description || "",
          candidate.complaintType || ""
        );
        const masterType = inferComplaintType(
          master.description || "",
          master.complaintType || ""
        );
        const sameType = candidateType.toLowerCase() === masterType.toLowerCase();

        const best = getBestDuplicateMatch(
          candidate.description,
          [master],
          0.45,
          candidateType
        );

        if (best && sameType) {
          candidate.status = "Duplicate";
          candidate.duplicateOf = master._id;
          candidate.duplicateScore = Number(best.score.toFixed(3));
          candidate.priority = predictPriority(
            candidate.description || "",
            candidateType
          );
          candidate.complaintType = candidateType;
          candidate.category = candidateType;
          await candidate.save();
          mergedCount += 1;
        }
      }
    }

    res.json({
      success: true,
      message: `${mergedCount} complaints marked as duplicate`,
      mergedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Merge failed" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || "")
      .toLowerCase()
      .trim();

    if (!email) {
      return res.status(400).json({ success: false, message: "User email is required" });
    }

    const user = await User.findOne({ email, role: "user" });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.deleteOne({ _id: user._id });
    const complaintDeleteResult = await Complaint.deleteMany({ userEmail: email });

    res.json({
      success: true,
      message: "User deleted successfully",
      deletedComplaints: complaintDeleteResult.deletedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete user failed" });
  }
};

exports.cleanupInvalidComplaints = async (req, res) => {
  try {
    const allowedDepartments = ["CSE", "IT", "EEE", "ECE", "CIVIL"];
    const allowedComplaintTypes = [
      "Academic",
      "Infrastructure",
      "Hostel",
      "College",
      "Transport",
    ];

    const result = await Complaint.deleteMany({
      $or: [
        { department: { $nin: allowedDepartments } },
        { complaintType: { $nin: allowedComplaintTypes } },
      ],
    });

    res.json({
      success: true,
      message: "Invalid complaints deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Cleanup failed" });
  }
};
