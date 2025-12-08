// routes/userRoutes.js

import express from "express";
import {
  getUserById, 
  getUsers, 
  updateUserProfile,
  toggleFollow,
  searchUsers,
  createOrUpdateUser,
  getUserProfile  // Added function for "View Other Profiles"
} from "../controllers/userController.js";

const router = express.Router();

// Public routes
router.get("/", getUsers); // Get all users (for browsing/searching)
router.get("/search", searchUsers); // Search users by query
router.get("/:id", getUserById); // Get user by ID
router.get("/:userId", getUserProfile); // Get user profile by userId (View Other Profiles)

// Protected routes (add authentication middleware later)
router.post("/", createOrUpdateUser); // Create or update a user
router.put("/:id", updateUserProfile); // Update user profile
router.post("/follow", toggleFollow); // Follow or unfollow a user

export default router;

