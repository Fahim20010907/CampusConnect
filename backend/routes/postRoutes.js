import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  toggleLike,
  addComment,
  getUserPosts,
  toggleCommentLike,
  addReply,
  deletePost,
  deleteComment,
  deleteReply,
  editPost
} from "../controller/postController.js";

const router = express.Router();

// Public routes
router.get("/", getPosts);
router.get("/:id", getPostById);
router.get("/user/:email", getUserPosts);

// Create/update routes
router.post("/", createPost);
router.post("/like", toggleLike);
router.post("/comment", addComment);
router.post("/comment/like", toggleCommentLike);
router.post("/comment/reply", addReply);
router.put("/", editPost);  // Add edit route

// Delete routes
router.delete("/", deletePost);
router.delete("/comment", deleteComment);
router.delete("/comment/reply", deleteReply);

export default router;