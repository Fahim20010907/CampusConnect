import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js"; // ✅ NEW
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ NEW

// Database connection
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/resources", resourceRoutes); // ✅ NEW

// Health check route
app.get("/", (req, res) => {
    res.json({ message: "CampusConnect API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!"
    });
});

// Server Start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📝 API available at http://localhost:${PORT}/api`);
});
