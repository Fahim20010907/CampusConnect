import express from "express";
import {
  getAdminStats,
  getReports,
  getAdminUsers,
  getAdminEvents,
  deleteUser,
  deleteEvent,
  softDeleteUser,
  updateUserRole,
} from "../controller/adminController.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// All admin routes require admin verification
router.use(verifyAdmin);

// Stats and reports
router.get("/stats", getAdminStats);
router.get("/reports", getReports);

// User management
router.get("/users", getAdminUsers);
router.delete("/users/:id", deleteUser);
router.delete("/users/:id/soft-delete", softDeleteUser);
router.put("/users/:id/role", updateUserRole);

// Event management
router.get("/events", getAdminEvents);
router.delete("/events/:id", deleteEvent);

export default router;
