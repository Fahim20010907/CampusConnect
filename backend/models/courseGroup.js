import mongoose from "mongoose";

const courseGroupSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    courseCode: {
      type: String,
    },
    // The associated conversation for this course group
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      default: "",
    },
    // Last message info for group display
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
courseGroupSchema.index({ courseId: 1 });
courseGroupSchema.index({ members: 1 });
courseGroupSchema.index({ lastMessageTime: -1 });

export default mongoose.model("CourseGroup", courseGroupSchema);
