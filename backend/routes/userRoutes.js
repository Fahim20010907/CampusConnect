import express from "express";
import { 
    
    getUserById, 
    getUsers, 
    updateUserProfile,
    toggleFollow,
    searchUsers,
    createOrUpdateUser
} from "../controller/userController.js";

const router = express.Router();

// Public routes
router.get("/", getUsers);
router.get("/search", searchUsers);
router.get("/:id", getUserById);

// Protected routes (add authentication middleware later)
router.post("/", createOrUpdateUser);
router.put("/:id", updateUserProfile);
router.post("/follow", toggleFollow);

export default router;