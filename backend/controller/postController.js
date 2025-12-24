import Post from "../models/post.js";
import User from "../models/user.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, images, userEmail } = req.body;

    console.log("Creating post for user:", userEmail);
    console.log("Content:", content);
    console.log("Images:", images);

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Post content is required"
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    // Find user by email
    let user = await User.findOne({ email: userEmail });
    
    // If user doesn't exist, create one
    if (!user) {
      user = await User.create({
        name: userEmail.split('@')[0],
        email: userEmail,
        profilePicture: ""
      });
      console.log("Created new user:", user.email);
    }

    // Create the post
    const post = await Post.create({
      author: user._id,
      content: content.trim(),
      images: images || [], // Handle undefined images
      likes: [],
      comments: []
    });

    // Populate author info
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email profilePicture');

    res.status(201).json({
      success: true,
      data: populatedPost,
      message: "Post created successfully"
    });

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email profilePicture')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts"
    });
  }
};

// Get post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture')
      .populate('comments.user', 'name profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Like/Unlike post
export const toggleLike = async (req, res) => {
  try {
    const { postId, userEmail } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const userIndex = post.likes.indexOf(user._id);
    
    if (userIndex > -1) {
      // Unlike
      post.likes.splice(userIndex, 1);
      await post.save();
      
      return res.status(200).json({
        success: true,
        liked: false,
        likeCount: post.likes.length
      });
    } else {
      // Like
      post.likes.push(user._id);
      await post.save();
      
      return res.status(200).json({
        success: true,
        liked: true,
        likeCount: post.likes.length
      });
    }

  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const { postId, content, userEmail } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = {
      user: user._id,
      content: content.trim()
    };

    post.comments.push(comment);
    await post.save();

    // Get the updated post with populated comments
    const updatedPost = await Post.findById(postId)
      .populate('comments.user', 'name profilePicture');

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.status(201).json({
      success: true,
      data: newComment
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const posts = await Post.find({ author: user._id })
      .populate('author', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts
    });

  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};