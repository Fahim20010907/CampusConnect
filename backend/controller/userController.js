import mongoose from "mongoose";
import User from "../models/user.js";

/* ================================
   Create or Update User
================================ */
export const createOrUpdateUser = async (req, res) => {
    try {
        const { name, email, photoURL } = req.body;

        let existingUser = await User.findOne({ email });

        if (existingUser) {
            existingUser.name = name || existingUser.name;
            existingUser.profilePicture = photoURL || existingUser.profilePicture;
            await existingUser.save();

            return res.status(200).json({
                success: true,
                data: existingUser,
                message: "User updated successfully"
            });
        }

        const newUser = await User.create({
            name,
            email,
            profilePicture: photoURL || ""
        });

        res.status(201).json({
            success: true,
            data: newUser,
            message: "User created successfully"
        });
    } catch (error) {
        console.error("Error creating/updating user:", error);
        res.status(400).json({
            success: false,
            message: error.message,
            error: error.code === 11000 ? "Email already exists" : error.message
        });
    }
};



//get user by email

export const getUserByEmail = async (req, res) => {
    try {
      const { email } = req.params;
  
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }
  
      const user = await User.findOne({ email })
        .select("-password") // remove if you don't use password
        .populate("followers", "_id name email")
        .populate("following", "_id name email");
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get user by email error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };







/* ================================
   Get User By ID
================================ */
export const getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(req.params.id)
            .select("-__v")
            .populate("followers", "name email profilePicture")
            .populate("following", "name email profilePicture");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* ================================
   Get All Users
================================ */
export const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-__v")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* ================================
   Update User Profile (SAFE)
================================ */
export const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const allowedFields = [
            "name",
            "bio",
            "department",
            "profilePicture",
            "skills",
            "socialLinks",
            "phone",
            "year"
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: "Profile updated successfully"
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/* ================================
   Follow / Unfollow User
================================ */
export const toggleFollow = async (req, res) => {
    try {
      const { userId, targetUserId } = req.body;
  
      if (userId === targetUserId) {
        return res.status(400).json({ success: false, message: "You cannot follow yourself" });
      }
  
      // Convert string IDs to ObjectId
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const targetObjectId = new mongoose.Types.ObjectId(targetUserId);
  
      const [user, targetUser] = await Promise.all([
        User.findById(userObjectId),
        User.findById(targetObjectId)
      ]);
  
      if (!user || !targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      // Check if already following
      const isFollowing = user.following.some(id => id.equals(targetObjectId));
  
      if (isFollowing) {
        user.following = user.following.filter(id => !id.equals(targetObjectId));
        targetUser.followers = targetUser.followers.filter(id => !id.equals(userObjectId));
      } else {
        user.following.push(targetObjectId);
        targetUser.followers.push(userObjectId);
      }
  
      await Promise.all([user.save(), targetUser.save()]);
  
      res.status(200).json({
        success: true,
        data: {
          isFollowing: !isFollowing,
          followerCount: targetUser.followers.length,
          followingCount: user.following.length
        },
        message: isFollowing ? "Unfollowed successfully" : "Followed successfully"
      });
  
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

/* ================================
   Search Users
================================ */
export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { department: { $regex: query, $options: "i" } }
            ]
        }).select("name email profilePicture department role");

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
