import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

// Attach io to app for access in controllers
app.set('io', io);

// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);

// Health check route
app.get("/", (req, res) => {
    res.json({ message: "CampusConnect API is running" });
});

//event
app.use("/api/events", eventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: "Something went wrong!" 
    });
});

// Socket.io Event Handling
const userSockets = new Map(); // Map of userId -> socketId

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user socket
  socket.on("register", (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join conversation room
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Handle incoming message
  socket.on("send_message", (data) => {
    const { conversationId, message, senderId } = data;
    // Broadcast to all users in the conversation
    io.to(`conversation_${conversationId}`).emit("receive_message", {
      conversationId,
      message,
      senderId,
      timestamp: new Date(),
    });
    console.log(`Message sent to conversation ${conversationId}`);
  });

  // Join group chat room
  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Leave group chat room
  socket.on("leave_group", (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  // Handle group message
  socket.on("send_group_message", (data) => {
    const { groupId, message, senderId } = data;
    io.to(`group_${groupId}`).emit("receive_group_message", {
      groupId,
      message,
      senderId,
      timestamp: new Date(),
    });
    console.log(`Group message sent to group ${groupId}`);
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const { conversationId, userId, isTyping } = data;
    io.to(`conversation_${conversationId}`).emit("user_typing", {
      userId,
      isTyping,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    // Remove user from map
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Server Start
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📝 API available at http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket listening on ws://localhost:${PORT}`);
});