import express from "express";
import { 
  createPost,
  getPosts,
  getPostById,
  toggleLike,
  addComment,
  getUserPosts
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

export default router;