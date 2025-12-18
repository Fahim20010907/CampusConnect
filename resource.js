import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseName: { type: String, required: true },
  subject: { type: String },
  filePath: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource; // ✅ ESM default export


