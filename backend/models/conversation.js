import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // For Private Conversations (1-on-1)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // For Group Conversations (course-based)
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: null,
    },
    // If it's a group chat, link to CourseGroup
    courseGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseGroup",
      default: null,
    },
    // Last message preview for list display
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Track unread counts per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  { timestamps: true }
);

// Index for quick lookups of participant conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ courseGroupId: 1 });
conversationSchema.index({ lastMessageTime: -1 });

export default mongoose.model("Conversation", conversationSchema);
