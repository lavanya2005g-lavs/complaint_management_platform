const express = require("express");
const router = express.Router();

const { protectAdmin } = require("../middleware/adminMiddleware");
const {
	getDashboardData,
	getAllComplaints,
	updateComplaint,
	mergeSimilarComplaints,
	deleteUser,
	cleanupInvalidComplaints,
} = require("../controllers/adminController");

router.get("/dashboard", protectAdmin, getDashboardData);
router.get("/complaints", protectAdmin, getAllComplaints);
router.patch("/complaints/:id", protectAdmin, updateComplaint);
router.post("/merge-duplicates", protectAdmin, mergeSimilarComplaints);
router.delete("/users/:email", protectAdmin, deleteUser);
router.post("/cleanup-invalid", protectAdmin, cleanupInvalidComplaints);

module.exports = router;