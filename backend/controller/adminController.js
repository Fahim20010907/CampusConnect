import User from "../models/user.js";
import Event from "../models/event.js";
import { logAdminAction } from "../middleware/verifyAdmin.js";

/**
 * GET /api/admin/stats
 * Fetch high-level metrics
 */
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();

    // For posts, if you have a post model, uncomment and use it
    // const totalPosts = await Post.countDocuments();
    const totalPosts = 0; // Placeholder until Post model exists

    // Get reported content count (if you have a report collection)
    // For now, we'll create this as a field in future implementations
    const reportedContent = 0; // Placeholder

    logAdminAction("FETCH_ADMIN_STATS", req.adminUser._id, {
      totalUsers,
      totalEvents,
      totalPosts,
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalPosts,
        reportedContent,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/reports
 * View all reported content
 */
export const getReports = async (req, res) => {
  try {
    // This requires a Report model to be implemented
    // For now, returning placeholder structure
    const reports = [];

    logAdminAction("FETCH_REPORTS", req.adminUser._id, {
      totalReports: reports.length,
    });

    res.status(200).json({
      success: true,
      data: reports,
      message: "Reports retrieval. Implement Report model for full functionality.",
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/users
 * Get all users with optional filtering
 */
export const getAdminUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-__v")
      .sort({ createdAt: -1 });

    logAdminAction("FETCH_ALL_USERS", req.adminUser._id, {
      totalUsers: users.length,
      filters: { role, search },
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/events
 * Get all events with optional filtering
 */
export const getAdminEvents = async (req, res) => {
  try {
    const { createdBy, search } = req.query;

    let query = {};

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(query).sort({ createdAt: -1 });

    logAdminAction("FETCH_ALL_EVENTS", req.adminUser._id, {
      totalEvents: events.length,
      filters: { createdBy, search },
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logAdminAction("DELETE_USER", req.adminUser._id, {
      deletedUser: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/admin/events/:id
 * Delete an event
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    logAdminAction("DELETE_EVENT", req.adminUser._id, {
      deletedEvent: {
        id: event._id,
        title: event.title,
        createdBy: event.createdBy,
      },
    });

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/admin/users/:id/soft-delete
 * Soft delete a user (mark as inactive instead of removing)
 */
export const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isVerified: false }, // Using isVerified as a soft delete flag
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logAdminAction("SOFT_DELETE_USER", req.adminUser._id, {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["student", "faculty", "club_coordinator", "admin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: " + validRoles.join(", "),
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logAdminAction("UPDATE_USER_ROLE", req.adminUser._id, {
      userId: user._id,
      newRole: role,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
