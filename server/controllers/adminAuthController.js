const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email, role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });

    console.log("✅ Admin Created Successfully");

    res.status(201).json({
      message: "Admin created successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email }
    });

  } catch (error) {
    console.log("❌ Registration Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Admin Login Body:", req.body);

    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Password incorrect" });
    }

    // 🔥 CREATE TOKEN
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ Admin Login Successful");

    res.status(200).json({
      message: "Admin login successful",
      token
    });

  } catch (error) {
    console.log("❌ Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};