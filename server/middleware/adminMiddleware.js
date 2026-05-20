const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protectAdmin = async (req, res, next) => {

  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await User.findById(decoded.id);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    req.admin = admin;
    next();

  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};