import express from "express";
import { 
    getUserById, 
    getUserByEmail,
    getUsers, 
    updateUserProfile,
    updateUserProfileByEmail,
    toggleFollow,
    searchUsers,
    createOrUpdateUser
} from "../controller/userController.js";

const router = express.Router();

// Public routes
router.get("/", getUsers);
router.get("/search", searchUsers);
router.get("/:id", getUserById);
router.get("/email/:email", getUserByEmail);

// Protected routes (add authentication middleware later)
router.post("/", createOrUpdateUser);
router.put("/:id", updateUserProfile);
router.put("/email/:email", updateUserProfileByEmail);
router.post("/follow", toggleFollow);

export default router;