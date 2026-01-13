import express from "express";
import {
    createOrUpdateUser,
    getUserById,
    getUserByEmail,
    getUsers,
    updateUserProfile,
    updateUserProfileByEmail,
    toggleFollow,
    searchUsers
} from "../controller/userController.js";

const router = express.Router();

// User routes
router.post("/", createOrUpdateUser);
router.get("/", getUsers);
router.get("/search", searchUsers);
router.get("/:id", getUserById);
router.get("/email/:email", getUserByEmail);
router.put("/:id", updateUserProfile);
router.put("/email/:email", updateUserProfileByEmail);
router.post("/follow", toggleFollow);

export default router;