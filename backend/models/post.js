import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      default: "",
    },
    authorProfilePicture: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "general",
        "study_materials",
        "announcements",
        "clubs",
        "events",
        "questions",
        "tips",
        "other",
      ],
      default: "general",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        authorName: String,
        authorProfilePicture: String,
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    shares: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments ? this.comments.length : 0;
});

// Virtual for engagement score (for sorting)
postSchema.virtual("engagementScore").get(function () {
  const likeCount = this.likes ? this.likes.length : 0;
  const commentCount = this.comments ? this.comments.length : 0;
  return likeCount + commentCount;
});

// Index for efficient sorting
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });
postSchema.index({ "comments.createdAt": -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);
