import express from "express";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} from "../controller/postController.js";

const router = express.Router();

// Public routes
router.get("/", getAllPosts); // GET /api/posts with ?sort=recent|popular
router.get("/:id", getPostById);

// Create post
router.post("/", createPost);

// Update post
router.put("/:id", updatePost);

// Delete post
router.delete("/:id", deletePost);

// Like/Unlike post
router.post("/:id/like", toggleLike);

// Add comment
router.post("/:id/comment", addComment);

// Delete comment
router.delete("/:id/comment/:commentId", deleteComment);

export default router;
