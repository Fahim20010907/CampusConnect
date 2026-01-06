import express from "express";
import {
  sendMessage,
  getConversationMessages,
  getUserConversations,
  getOrCreatePrivateConversation,
  markConversationAsRead,
  deleteMessage,
  editMessage,
  getUserCourseGroups,
  enrollInCourseGroup,
  sendGroupMessage,
  getGroupMessages,
} from "../controller/messageController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Private Messaging Routes
router.post("/", sendMessage); // Send message to conversation
router.get("/conversations", getUserConversations); // Get all user conversations
router.get("/conversations/:conversationId", getConversationMessages); // Get messages in conversation
router.post("/conversation/create", getOrCreatePrivateConversation); // Create or get 1-on-1 conversation
router.put("/conversations/:conversationId/read", markConversationAsRead); // Mark conversation as read
router.delete("/:messageId", deleteMessage); // Delete a message
router.put("/:messageId", editMessage); // Edit a message

// Course Group Routes
router.get("/groups", getUserCourseGroups); // Get user's course groups
router.post("/groups/enroll", enrollInCourseGroup); // Enroll current user in a course group
router.post("/groups/send", sendGroupMessage); // Send message to group
router.get("/groups/:groupId/messages", getGroupMessages); // Get group messages

export default router;
