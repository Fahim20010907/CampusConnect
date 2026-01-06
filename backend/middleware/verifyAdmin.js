import User from "../models/user.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../logs");

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log admin actions to file and console
 */
export const logAdminAction = (action, userId, details = {}) => {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    action,
    userId,
    details,
  };

  const logEntry = `[${timestamp}] ACTION: ${action} | USER: ${userId} | DETAILS: ${JSON.stringify(
    details
  )}\n`;

  // Write to log file
  const logFilePath = path.join(logsDir, "admin-actions.log");
  fs.appendFileSync(logFilePath, logEntry);

  // Also log to console
  console.log(
    `📋 ADMIN ACTION: ${action} | User: ${userId}`,
    details
  );
};

/**
 * Middleware to verify if user is an admin
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required in headers",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      logAdminAction("UNAUTHORIZED_ACCESS_ATTEMPT", userId, {
        userRole: user.role,
        endpoint: req.path,
        method: req.method,
      });

      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Attach user to request for logging
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during admin verification",
    });
  }
};

export default verifyAdmin;
