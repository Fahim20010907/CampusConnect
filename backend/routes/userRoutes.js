import express from "express";
import { 
    
    getUserById, 
    getUsers, 
    updateUserProfile,
    toggleFollow,
    searchUsers,
    createOrUpdateUser,
    getUserByEmail
} from "../controller/userController.js";

const router = express.Router();

// Public routes
router.get("/by-email/:email", getUserByEmail); // specific route FIRST
router.get("/search", searchUsers);
router.get("/", getUsers);
router.get("/:id", getUserById); // dynamic route LAST


// Protected routes (add authentication middleware later)
router.post("/", createOrUpdateUser);
router.put("/:id", updateUserProfile);
router.post("/follow", toggleFollow);

export default router;