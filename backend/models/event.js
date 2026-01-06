import mongoose from "mongoose";

const rsvpSchema = new mongoose.Schema(
  {
    user: {
      type: String, // ✅ Firebase UID
      required: true
    },
    status: {
      type: String,
      enum: ["Interested", "Going"],
      required: true
    }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    date: { type: Date }, // store as proper Date
    createdBy: { type: String, required: true }, // Firebase UID
    rsvps: [rsvpSchema],
  },
  { timestamps: true }
);

// Export model safely
const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
export default Event;
