import Post from "../models/post.js";
import User from "../models/user.js";

// Like/Unlike post - Fixed with correct syntax
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

    // Find the post first to check if user already liked it
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user already liked the post
    const isLiked = post.likes.some(likeId => likeId.toString() === user._id.toString());

    // Prepare update operation
    let updateOperation;
    if (isLiked) {
      // Unlike - remove user from likes array
      updateOperation = { $pull: { likes: user._id } };
    } else {
      // Like - add user to likes array
      updateOperation = { $addToSet: { likes: user._id } };
    }

    // Apply update
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateOperation,
      {
        new: true,
        runValidators: true
      }
    ).populate('likes', 'name email profilePicture');

    res.status(200).json({
      success: true,
      liked: !isLiked, // true if now liked, false if now unliked
      likeCount: updatedPost.likes.length,
      likes: updatedPost.likes
    });

  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Like/Unlike comment - Fixed with correct syntax
export const toggleCommentLike = async (req, res) => {
  try {
    const { postId, commentId, userEmail } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Find the post first
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user already liked the comment
    const isLiked = comment.likes.some(likeId => likeId.toString() === user._id.toString());

    // Prepare update operation
    let updateOperation;
    if (isLiked) {
      // Unlike comment
      updateOperation = { $pull: { "comments.$[comment].likes": user._id } };
    } else {
      // Like comment
      updateOperation = { $addToSet: { "comments.$[comment].likes": user._id } };
    }

    // Apply update
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      updateOperation,
      {
        arrayFilters: [{ "comment._id": commentId }],
        new: true,
        runValidators: true
      }
    ).populate('comments.likes', 'name email profilePicture');

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found after update"
      });
    }

    const updatedComment = updatedPost.comments.id(commentId);

    res.status(200).json({
      success: true,
      liked: !isLiked,
      likeCount: updatedComment.likes.length,
      data: updatedComment
    });

  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add comment - Fixed
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

    // Add comment using atomic update
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        $push: {
          comments: {
            user: user._id,
            content: content.trim(),
            likes: [],
            replies: []
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'comments.user',
      select: 'name email profilePicture'
    });

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

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

// Add reply to comment - Fixed
export const addReply = async (req, res) => {
  try {
    const { postId, commentId, content, userEmail } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reply content is required"
      });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Add reply using atomic update
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        $push: {
          "comments.$[comment].replies": {
            user: user._id,
            content: content.trim()
          }
        }
      },
      {
        arrayFilters: [{ "comment._id": commentId }],
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'comments.replies.user',
      select: 'name email profilePicture'
    });

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = updatedPost.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found after update"
      });
    }

    const newReply = comment.replies[comment.replies.length - 1];

    res.status(201).json({
      success: true,
      data: newReply
    });

  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete comment - Fixed
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId, userEmail } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // First find the comment to check ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own comments"
      });
    }

    // Delete comment using atomic update
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        $pull: { comments: { _id: commentId } }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found after update"
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete reply - Fixed
export const deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId, userEmail } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // First find the reply to check ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found"
      });
    }

    // Check if user is the reply author
    if (reply.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own replies"
      });
    }

    // Delete reply using atomic update
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        $pull: { "comments.$[comment].replies": { _id: replyId } }
      },
      {
        arrayFilters: [{ "comment._id": commentId }],
        new: true,
        runValidators: true
      }
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found after update"
      });
    }

    res.status(200).json({
      success: true,
      message: "Reply deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Edit post - Fixed
export const editPost = async (req, res) => {
  try {
    const { postId, content, images, userEmail } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Post content is required"
      });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // First find the post to check ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user is the author
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only edit your own posts"
      });
    }

    // Update post using atomic update
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        $set: {
          content: content.trim(),
          images: images || [],
          updatedAt: Date.now()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'name email profilePicture');

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found after update"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedPost,
      message: "Post updated successfully"
    });

  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete post - Fixed
export const deletePost = async (req, res) => {
  try {
    const { postId, userEmail } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // First find the post to check ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user is the author
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own posts"
      });
    }

    // Delete post using atomic operation
    const result = await Post.deleteOne({ _id: postId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found or already deleted"
      });
    }

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new post - Fixed
export const createPost = async (req, res) => {
  try {
    const { content, images, userEmail } = req.body;

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

    // Find or create user
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await User.create({
        name: userEmail.split('@')[0],
        email: userEmail,
        profilePicture: ""
      });
    }

    // Create the post
    const post = await Post.create({
      author: user._id,
      content: content.trim(),
      images: images || [],
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
      message: "Server error"
    });
  }
};

// Get all posts - Fixed
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name email profilePicture'
      })
      .populate('likes', 'name email profilePicture')
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

// Get post by ID - Fixed
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name email profilePicture'
      })
      .populate('likes', 'name email profilePicture');

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

// Get user's posts - Fixed
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
      .populate({
        path: 'comments.user',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name email profilePicture'
      })
      .populate('likes', 'name email profilePicture')
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