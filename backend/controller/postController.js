import Post from "../models/post.js";
import User from "../models/user.js";
import mongoose from "mongoose";

/**
 * GET /api/posts
 * Fetch all posts with sorting capabilities
 * Query params:
 *  - sort: 'recent' | 'popular' (default: 'recent')
 *  - category: filter by category
 *  - limit: number of posts (default: 20)
 *  - page: pagination page (default: 1)
 */
export const getAllPosts = async (req, res) => {
  try {
    const { sort = "recent", category, limit = 20, page = 1 } = req.query;

    // Build filter
    const filter = { isPublished: true };
    if (category && category !== "all") {
      filter.category = category;
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    let sortOrder = {};

    if (sort === "popular") {
      // Sort by engagement (likes + comments count)
      // We'll fetch all and sort in-memory for better performance
      // OR use aggregation pipeline for efficient sorting
      const posts = await Post.find(filter)
        .populate("author", "name email profilePicture department")
        .populate("likes", "_id")
        .populate("comments.author", "name profilePicture")
        .lean()
        .exec();

      // Calculate engagement score and sort
      const postsWithScore = posts.map((post) => {
        const likeCount = post.likes ? post.likes.length : 0;
        const commentCount = post.comments ? post.comments.length : 0;
        return {
          ...post,
          _engagementScore: likeCount + commentCount,
        };
      });

      // Sort by engagement score descending
      const sorted = postsWithScore.sort((a, b) => b._engagementScore - a._engagementScore);

      // Apply pagination
      const paginated = sorted.slice(skip, skip + parseInt(limit));

      // Get total count
      const total = sorted.length;

      return res.status(200).json({
        success: true,
        data: paginated,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        sort,
      });
    } else {
      // Default: sort by recent (createdAt descending)
      sortOrder = { createdAt: -1 };

      const total = await Post.countDocuments(filter);

      const posts = await Post.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("author", "name email profilePicture department")
        .populate("likes", "_id")
        .populate("comments.author", "name profilePicture")
        .exec();

      return res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        sort,
      });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
};

/**
 * GET /api/posts/:id
 * Fetch a single post by ID
 */
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(id)
      .populate("author", "name email profilePicture department")
      .populate("likes", "_id name email")
      .populate("comments.author", "name profilePicture email");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Increment view count
    post.views = (post.views || 0) + 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch post",
      error: error.message,
    });
  }
};

/**
 * POST /api/posts
 * Create a new post
 */
export const createPost = async (req, res) => {
  try {
    const { title, content, author, category, image, tags } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and author are required",
      });
    }

    // Get author details
    const authorUser = await User.findById(author);
    if (!authorUser) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    const post = new Post({
      title,
      content,
      author,
      authorName: authorUser.name,
      authorProfilePicture: authorUser.profilePicture,
      category: category || "general",
      image: image || "",
      tags: tags || [],
    });

    await post.save();

    // Populate and return
    const populatedPost = await Post.findById(post._id)
      .populate("author", "name email profilePicture department")
      .populate("likes", "_id")
      .populate("comments.author", "name profilePicture");

    res.status(201).json({
      success: true,
      data: populatedPost,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message,
    });
  }
};

/**
 * PUT /api/posts/:id
 * Update a post
 */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, image, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(image && { image }),
        ...(tags && { tags }),
      },
      { new: true }
    )
      .populate("author", "name email profilePicture department")
      .populate("likes", "_id")
      .populate("comments.author", "name profilePicture");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message,
    });
  }
};

/**
 * POST /api/posts/:id/like
 * Like/Unlike a post
 */
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user already liked
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    const populatedPost = await Post.findById(id)
      .populate("author", "name email profilePicture department")
      .populate("likes", "_id name email")
      .populate("comments.author", "name profilePicture");

    res.status(200).json({
      success: true,
      data: populatedPost,
      message: alreadyLiked ? "Post unliked" : "Post liked",
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
      error: error.message,
    });
  }
};

/**
 * POST /api/posts/:id/comment
 * Add a comment to a post
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, authorName, authorProfilePicture, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: "User ID and content are required",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = {
      _id: new mongoose.Types.ObjectId(),
      author: userId,
      authorName: authorName || "Anonymous",
      authorProfilePicture: authorProfilePicture || "",
      content,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate("author", "name email profilePicture department")
      .populate("likes", "_id")
      .populate("comments.author", "name profilePicture");

    res.status(201).json({
      success: true,
      data: populatedPost,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/posts/:id/comment/:commentId
 * Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post or comment ID",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    post.comments = post.comments.filter((comment) => comment._id.toString() !== commentId);
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate("author", "name email profilePicture department")
      .populate("likes", "_id")
      .populate("comments.author", "name profilePicture");

    res.status(200).json({
      success: true,
      data: populatedPost,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};
