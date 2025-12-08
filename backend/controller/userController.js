import user from "../models/user.js";


// Create or update user
export const createOrUpdateUser = async (req, res) => {
    try {
        const { name, email, photoURL } = req.body;
        
        // Check if user exists
        let user = await user.findOne({ email });
        
        if (user) {
            // Update existing user
            user.name = name || user.name;
            user.profilePicture = photoURL || user.profilePicture;
            user.updatedAt = Date.now();
            await user.save();
            
            return res.status(200).json({
                success: true,
                data: user,
                message: "User updated successfully"
            });
        }
        
        // Create new user
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

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-__v')
            .populate('followers', 'name email profilePicture')
            .populate('following', 'name email profilePicture');
            
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

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-__v')
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

// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Find and update user
        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-__v');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: user,
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

// Follow/Unfollow user
export const toggleFollow = async (req, res) => {
    try {
        const { userId, targetUserId } = req.body;
        
        const [user, targetUser] = await Promise.all([
            user.findById(userId),
            user.findById(targetUserId)
        ]);
        
        if (!user || !targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        const isFollowing = user.following.includes(targetUserId);
        
        if (isFollowing) {
            // Unfollow
            user.following = user.following.filter(id => id.toString() !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);
        } else {
            // Follow
            user.following.push(targetUserId);
            targetUser.followers.push(userId);
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
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Search users
export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { department: { $regex: query, $options: 'i' } }
            ]
        }).select('name email profilePicture department role');
        
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