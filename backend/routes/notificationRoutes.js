import express from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,   // ⬅️ ADD THIS
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================
// NOTIFICATION ROUTES
// ======================

// GET my notifications
router.get("/my", protect, getMyNotifications);

// mark ALL read
router.patch("/read-all", protect, markAllNotificationsAsRead);

// mark SINGLE read
router.patch("/:id/read", protect, markNotificationAsRead);

// delete ALL notifications  ⬅️ NEW ROUTE
router.delete("/all", protect, deleteAllNotifications);

// delete SINGLE notification
router.delete("/:id", protect, deleteNotification);

export default router;
