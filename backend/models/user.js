import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
   // _id: { type: String }, // Firebase UID

    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String, default: "" },
    department: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    role: { 
      type: String, 
      enum: ['student', 'faculty', 'club_coordinator', 'admin'], 
      default: 'student' 
    },
    studentId: { type: String, default: "" },
    phone: { type: String, default: "" },
    year: { type: Number, default: 1 },
    skills: [{ type: String }],
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      twitter: { type: String, default: "" }
    },
    // ✅ Make followers/following arrays also store Firebase UID strings
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],    
    isVerified: { type: Boolean, default: false }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

export default mongoose.model("User", userSchema);
