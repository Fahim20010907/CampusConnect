import mongoose from "mongoose";

/* Reply schema */
const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

/* Comment schema */
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    replies: [replySchema]
  },
  { timestamps: true }
);

/* Post schema - Remove versionKey or use it properly */
const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    images: [String],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    comments: [commentSchema]
  },
  {
    timestamps: true,
    // Option 1: Disable version key (if you don't need optimistic concurrency)
    // versionKey: false

    // Option 2: Keep version key but use atomic updates (recommended)
    // versionKey: '__v' // This is default
  }
);

// Create indexes for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ 'comments.createdAt': -1 });

export default mongoose.model("Post", postSchema);