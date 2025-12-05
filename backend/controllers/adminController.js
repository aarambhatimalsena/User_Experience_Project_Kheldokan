// controllers/adminController.js
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import generateToken from "../utils/generateToken.js";

// ✅ Same cookie style as normal user login (httpOnly, secure etc.)
const setAdminAuthCookie = (res, token) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ==========================
// 🔹 Admin Dashboard Stats
// ==========================
export const getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    const totalSalesAgg = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      totalOrders,
      totalSales: totalSalesAgg[0]?.total || 0,
      totalUsers,
      totalProducts,
    });
  } catch (err) {
    console.error("❌ getAdminStats error:", err);
    res.status(500).json({
      message: "Failed to fetch admin stats",
    });
  }
};

// ==========================
// 🔹 Admin Login (hardened)
// ==========================
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  // Generic error → avoid user enumeration
  const genericError = { message: "Invalid email or password" };

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // do not reveal if email exists
      return res.status(401).json(genericError);
    }

    // Must be admin
    if (user.role !== "admin") {
      // attacker lai hint nadine, tara internally log gara
      console.warn("Non-admin tried to login to admin panel:", normalizedEmail);
      return res.status(401).json(genericError);
    }

    // Account active?
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account is disabled. Please contact support.",
      });
    }

    // Brute-force lock check
    if (user.isLocked && user.isLocked()) {
      return res.status(423).json({
        message:
          "Your account is temporarily locked due to multiple failed attempts. Please try again later.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      if (user.registerFailedLogin) {
        await user.registerFailedLogin();
      }
      return res.status(401).json(genericError);
    }

    // Successful login → reset attempts + log security info
    if (user.registerSuccessfulLogin) {
      const ip = req.ip;
      const userAgent = req.headers["user-agent"];
      await user.registerSuccessfulLogin(ip, userAgent);
    }

    const token = generateToken(user._id); // uses your existing util
    setAdminAuthCookie(res, token);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error("❌ Admin login failed:", err);
    res.status(500).json({
      message: "Admin login failed",
    });
  }
};

// ==========================
// 🔹 [ADMIN] Get All Users
// ==========================
export const getAllUsers = async (req, res) => {
  try {
    // ✅ Do not expose sensitive fields
    const users = await User.find().select(
      "_id name email role isActive createdAt lastLoginAt"
    );
    res.json(users);
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users" });
  }
};

// ==========================
// 🔹 [ADMIN] Delete User
// ==========================
export const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot delete admin accounts (assignment ma ramro point)
    if (targetUser.role === "admin") {
      return res
        .status(403)
        .json({ message: "Cannot delete admin accounts" });
    }

    // Optional: prevent deleting yourself (safer)
    if (req.user && targetUser._id.toString() === req.user.id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await targetUser.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ==========================
// 🔹 [ADMIN] Update User Role
// ==========================
export const updateUserRole = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const newRole = req.body.role;
    const allowedRoles = ["user", "admin"];

    if (!newRole || !allowedRoles.includes(newRole)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    // Optional safety: prevent admin from removing own admin role
    if (
      req.user &&
      targetUser._id.toString() === req.user.id.toString() &&
      targetUser.role === "admin" &&
      newRole !== "admin"
    ) {
      return res
        .status(400)
        .json({ message: "You cannot remove your own admin role" });
    }

    targetUser.role = newRole;
    const updated = await targetUser.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    });
  } catch (err) {
    console.error("❌ updateUserRole error:", err);
    res.status(500).json({ message: "Role update failed" });
  }
};
