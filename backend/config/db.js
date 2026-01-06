import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // no options needed
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    // Do not exit the process so the dev server can run when DB is unreachable
    return;
  }
};

export default connectDB;
