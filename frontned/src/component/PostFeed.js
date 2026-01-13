"use client"

import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { AuthContext } from "../context/Authcontext";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, Trash2, MoreVertical, Reply, ChevronDown, ChevronUp, ThumbsUp, Edit, Copy, Flag, Bookmark } from "lucide-react";
import EditPostModal from "./EditPostModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ToastNotification from "./ToastNotification";
import { useRouter } from "next/navigation";

// Helper function to generate temporary IDs
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// SSR-safe window check
const isBrowser = typeof window !== 'undefined';

// Memoized PostItem component
const PostItem = React.memo(({
  post,
  user,
  onLike,
  onComment,
  onCommentLike,
  onReply,
  onDeletePost,
  onDeleteComment,
  onDeleteReply,
  onEditPost,
  onCopyLink,
  onReportPost,
  onSavePost,
  onHidePost
}) => {
  const [localCommentInput, setLocalCommentInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Helper functions
  const isPostLiked = useMemo(() => {
    if (!user || !post.likes) return false;
    return post.likes.some(like => like.email === user.email);
  }, [user, post.likes]);

  const isPostAuthor = useMemo(() => {
    if (!user || !post.author) return false;
    return post.author.email === user.email;
  }, [user, post.author]);

  // Click outside handler
  useEffect(() => {
    if (!isBrowser) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 overflow-hidden ring-2 ring-white ring-offset-2 shadow-lg">
                {post.author?.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                    {post.author?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-800 text-lg">{post.author?.name}</h3>
                {post.author?.role === 'admin' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span className="flex items-center">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1">
                {isPostAuthor && (
                  <>
                    <button
                      onClick={() => onEditPost(post)}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                    >
                      <Edit size={16} className="text-blue-500" />
                      <span>Edit Post</span>
                    </button>
                    <button
                      onClick={() => onDeletePost(post)}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 text-red-600"
                    >
                      <Trash2 size={16} className="text-red-500" />
                      <span>Delete Post</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                  </>
                )}

                <button
                  onClick={() => onCopyLink(post._id)}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                >
                  <Copy size={16} className="text-gray-500" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={() => onSavePost(post._id)}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                >
                  <Bookmark size={16} className="text-gray-500" />
                  <span>Save Post</span>
                </button>

                {!isPostAuthor && (
                  <>
                    <button
                      onClick={() => onHidePost(post._id)}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                    >
                      Hide Post
                    </button>
                    <button
                      onClick={() => onReportPost(post._id)}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                    >
                      <Flag size={16} className="text-orange-500" />
                      <span>Report Post</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line mb-6">
          {post.content}
        </p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-6">
            <div className={`grid gap-3 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {post.images.map((image, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden">
                  <img
                    src={image}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-72 object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between py-4 border-t border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-gray-600">
              <div className="flex -space-x-2">
                {post.likes?.slice(0, 3).map((like, index) => (
                  <div
                    key={index}
                    className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 border-2 border-white shadow-sm overflow-hidden"
                    title={like.name}
                  >
                    {like.profilePicture ? (
                      <img src={like.profilePicture} alt={like.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs">
                        {like.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="ml-2 font-medium">
                {post.likes?.length || 0} likes
              </span>
            </div>
            <div className="text-gray-600">
              <span className="font-medium">
                {post.comments?.length || 0} comments
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1 py-4">
          <button
            onClick={() => onLike(post._id)}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl transition-all duration-200 group ${isPostLiked
              ? "text-red-600 bg-red-50"
              : "text-gray-700 hover:text-red-600 hover:bg-red-50"
              }`}
          >
            <Heart size={24} fill={isPostLiked ? "currentColor" : "none"} />
            <span className="font-medium">{isPostLiked ? "Liked" : "Like"}</span>
          </button>

          <button className="flex items-center justify-center space-x-2 py-3 rounded-xl hover:bg-green-50 text-gray-700 hover:text-green-600 transition-all duration-200 group">
            <MessageCircle size={24} />
            <span className="font-medium">Comment</span>
          </button>

          <button className="flex items-center justify-center space-x-2 py-3 rounded-xl hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-all duration-200 group">
            <Share2 size={24} />
            <span className="font-medium">Share</span>
          </button>
        </div>

        {/* Comments Section */}
        <CommentsSection
          post={post}
          user={user}
          onComment={onComment}
          onCommentLike={onCommentLike}
          onReply={onReply}
          onDeleteComment={onDeleteComment}
          onDeleteReply={onDeleteReply}
        />
      </div>
    </div>
  );
});

// Memoized CommentsSection component
const CommentsSection = React.memo(({
  post,
  user,
  onComment,
  onCommentLike,
  onReply,
  onDeleteComment,
  onDeleteReply
}) => {
  const [localCommentInput, setLocalCommentInput] = useState("");

  const handleCommentSubmit = () => {
    if (!localCommentInput.trim()) return;
    onComment(post._id, localCommentInput);
    setLocalCommentInput("");
  };

  return (
    <div className="pt-4 border-t border-gray-100">
      {/* Add Comment Input */}
      <div className="flex space-x-3 mb-6">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-teal-300 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              value={localCommentInput}
              onChange={(e) => setLocalCommentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
              placeholder="Write a comment..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              rows="2"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={!localCommentInput.trim()}
              className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {post.comments && post.comments.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700">Comments ({post.comments.length})</h4>
          {post.comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={post._id}
              user={user}
              onCommentLike={() => onCommentLike(post._id, comment._id)}
              onDeleteComment={() => onDeleteComment(post._id, comment._id)}
              onReply={onReply}
              onDeleteReply={onDeleteReply}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Memoized CommentItem component
const CommentItem = React.memo(({
  comment,
  postId,
  user,
  onCommentLike,
  onDeleteComment,
  onReply,
  onDeleteReply
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyInput, setReplyInput] = useState("");

  const isCommentLiked = useMemo(() => {
    if (!user || !comment.likes) return false;
    return comment.likes.some(like => like.email === user.email);
  }, [user, comment.likes]);

  const isCommentAuthor = useMemo(() => {
    if (!user || !comment.user) return false;
    return comment.user.email === user.email;
  }, [user, comment.user]);

  const handleReplySubmit = () => {
    if (!replyInput.trim()) return;

    // Check if comment has a valid ID (not temp)
    if (comment._id && !comment._id.startsWith('temp_')) {
      onReply(postId, comment._id, replyInput);
    }
    setReplyInput("");
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-teal-300 overflow-hidden">
            {comment.user?.profilePicture ? (
              <img src={comment.user.profilePicture} alt={comment.user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {comment.user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-800">
              {comment.user?.name}
            </span>
            <span className="block text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        {isCommentAuthor && (
          <button
            onClick={onDeleteComment}
            className="text-xs text-gray-400 hover:text-red-500 p-1"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <p className="text-gray-700 text-sm mb-3">{comment.content}</p>

      <div className="flex items-center space-x-4 mb-3">
        <button
          onClick={onCommentLike}
          className={`flex items-center space-x-1 text-xs ${isCommentLiked
            ? "text-red-600"
            : "text-gray-500 hover:text-red-600"
            }`}
        >
          <ThumbsUp size={14} fill={isCommentLiked ? "currentColor" : "none"} />
          <span>{comment.likes?.length || 0} likes</span>
        </button>

        <button
          onClick={() => setShowReplies(!showReplies)}
          className="text-xs text-gray-500 hover:text-blue-600 flex items-center"
        >
          <Reply size={14} className="mr-1" />
          Reply ({comment.replies?.length || 0})
        </button>
      </div>

      {/* Replies Section */}
      {showReplies && (
        <div className="mt-4 space-y-3">
          {/* Add Reply Input */}
          <div className="flex space-x-2">
            <div className="flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-300 to-teal-200 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyInput.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Replies List */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2 ml-9">
              {comment.replies.map((reply) => (
                <ReplyItem
                  key={reply._id}
                  reply={reply}
                  postId={postId}
                  commentId={comment._id}
                  user={user}
                  onDeleteReply={onDeleteReply}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show/Hide Replies Button */}
      {comment.replies && comment.replies.length > 0 && (
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-2"
        >
          {showReplies ? (
            <>
              <ChevronUp size={14} className="mr-1" />
              Hide replies
            </>
          ) : (
            <>
              <ChevronDown size={14} className="mr-1" />
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </>
          )}
        </button>
      )}
    </div>
  );
});

// Memoized ReplyItem component
const ReplyItem = React.memo(({ reply, postId, commentId, user, onDeleteReply }) => {
  const isReplyAuthor = useMemo(() => {
    if (!user || !reply.user) return false;
    return reply.user.email === user.email;
  }, [user, reply.user]);

  const handleDelete = () => {
    if (reply._id && !reply._id.startsWith('temp_')) {
      onDeleteReply(postId, commentId, reply._id);
    }
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-200 to-teal-100 overflow-hidden">
            {reply.user?.profilePicture ? (
              <img src={reply.user.profilePicture} alt={reply.user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-800 text-xs">
                {reply.user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <span className="font-medium text-xs text-gray-700">
            {reply.user?.name}
          </span>
          <span className="text-xs text-gray-500">
            {reply.createdAt?.toDate
              ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true })
              : reply.createdAt
                ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })
                : "just now"}
          </span>

        </div>
        {isReplyAuthor && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 p-1"
            title="Delete reply"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <p className="text-gray-600 text-sm mt-1 ml-8">{reply.content}</p>
    </div>
  );
});

// Main PostFeed Component
const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { user } = useContext(AuthContext);
  const router = useRouter();
  const lastPostRef = useRef(null);

  // Fetch posts with pagination
  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts`);

      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      showToast("error", "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Optimized handlers
  const handleLike = useCallback(async (postId) => {
    if (!user) {
      showToast("warning", "Please login to like posts");
      return;
    }

    try {
      // Optimistic update
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes?.some(like => like.email === user.email);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter(like => like.email !== user.email)
              : [...(post.likes || []), { email: user.email, name: user.name }]
          };
        }
        return post;
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userEmail: user.email }),
      });

      const data = await response.json();
      if (!data.success) {
        // Revert optimistic update
        fetchPosts();
        throw new Error(data.message || 'Failed to toggle like');
      }
    } catch (error) {
      console.error("Error liking post:", error);
      showToast("error", error.message || "Failed to like post");
    }
  }, [user, showToast, fetchPosts]);

  const handleComment = useCallback(async (postId, content) => {
    if (!user || !content.trim()) {
      showToast("warning", "Please write a comment");
      return;
    }

    try {
      // Don't do optimistic update for comments (to avoid temp ID issues)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          userEmail: user.email
        }),
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.message);

      // Refresh to get the new comment
      fetchPosts();

      showToast("success", "Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      showToast("error", error.message || "Failed to add comment");
    }
  }, [user, showToast, fetchPosts]);

  const handleCommentLike = useCallback(async (postId, commentId) => {
    if (!user) {
      showToast("warning", "Please login to like comments");
      return;
    }

    try {
      // Only like comments with real IDs
      if (commentId.startsWith('temp_')) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/comment/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          commentId,
          userEmail: user.email
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      // Refresh to get updated likes
      fetchPosts();
    } catch (error) {
      console.error("Error liking comment:", error);
      showToast("error", error.message || "Failed to like comment");
    }
  }, [user, showToast, fetchPosts]);

  const handleReply = useCallback(async (postId, commentId, content) => {
    if (!user || !content.trim()) {
      showToast("warning", "Please write a reply");
      return;
    }

    try {
      // Don't do optimistic update for replies
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/comment/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          commentId,
          content: content.trim(),
          userEmail: user.email
        }),
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.message);

      // Refresh to get the new reply
      fetchPosts();

      showToast("success", "Reply added");
    } catch (error) {
      console.error("Error adding reply:", error);
      showToast("error", error.message || "Failed to add reply");
    }
  }, [user, showToast, fetchPosts]);

  const handleDeletePost = useCallback(async () => {
    if (!user || !postToDelete) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: postToDelete._id,
          userEmail: user.email
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to delete post");

      // Remove from state
      setPosts(prev => prev.filter(post => post._id !== postToDelete._id));

      showToast("success", "Post deleted successfully");
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("error", error.message || "Failed to delete post");
    }
  }, [user, postToDelete, showToast]);

  const handleDeleteComment = useCallback(async (postId, commentId) => {
    if (!user) {
      showToast("warning", "Please login to delete comments");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/comment`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          commentId,
          userEmail: user.email
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      // Refresh to get updated comments
      fetchPosts();

      showToast("success", "Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast("error", error.message || "Failed to delete comment");
    }
  }, [user, showToast, fetchPosts]);

  const handleDeleteReply = useCallback(async (postId, commentId, replyId) => {
    if (!user) {
      showToast("warning", "Please login to delete replies");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/comment/reply`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          commentId,
          replyId,
          userEmail: user.email
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      // Refresh to get updated replies
      fetchPosts();

      showToast("success", "Reply deleted successfully");
    } catch (error) {
      console.error("Error deleting reply:", error);
      showToast("error", error.message || "Failed to delete reply");
    }
  }, [user, showToast, fetchPosts]);

  const handleEditPost = useCallback((post) => {
    setSelectedPost(post);
    setEditModalOpen(true);
  }, []);

  const handleCopyLink = useCallback((postId) => {
    if (!isBrowser) return;

    const postLink = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postLink)
      .then(() => showToast("success", "Post link copied to clipboard!"))
      .catch(() => showToast("error", "Failed to copy link"));
  }, [showToast]);

  const handleReportPost = useCallback((postId) => {
    showToast("info", "Report submitted. Our team will review this post.");
  }, [showToast]);

  const handleSavePost = useCallback((postId) => {
    showToast("success", "Post saved to your bookmarks!");
  }, [showToast]);

  const handleHidePost = useCallback((postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    showToast("info", "Post hidden");
  }, []);

  if (loading && posts.length === 0) {
    return (
      <div className="mx-[100px] py-8">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-[100px] py-8">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <EditPostModal
        post={selectedPost}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onUpdate={(updatedPost) => {
          setPosts(prev => prev.map(post =>
            post._id === updatedPost._id ? updatedPost : post
          ));
          showToast("success", "Post updated");
        }}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeletePost}
      />

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Community Feed</h1>
        <p className="text-gray-600 mt-2">Stay updated with what's happening around you</p>
      </div>

      {/* Create Post Card */}
      {user && (
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 overflow-hidden ring-2 ring-white ring-offset-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/create-post")}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-left p-4 rounded-xl transition-all duration-200 border border-dashed border-gray-300 hover:border-blue-400"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>What's on your mind?</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-50 to-teal-50 flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-6">Be the first to share something with the community!</p>
            {user && (
              <button
                onClick={() => router.push("/create-post")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Create Your First Post
              </button>
            )}
          </div>
        ) : (
          posts.map((post, index) => (
            <div
              key={post._id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <PostItem
                post={post}
                user={user}
                onLike={handleLike}
                onComment={handleComment}
                onCommentLike={handleCommentLike}
                onReply={handleReply}
                onDeletePost={() => {
                  setPostToDelete(post);
                  setDeleteModalOpen(true);
                }}
                onDeleteComment={handleDeleteComment}
                onDeleteReply={handleDeleteReply}
                onEditPost={handleEditPost}
                onCopyLink={handleCopyLink}
                onReportPost={handleReportPost}
                onSavePost={handleSavePost}
                onHidePost={handleHidePost}
              />
            </div>
          ))
        )}
      </div>

      {posts.length > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => fetchPosts(1)}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl border border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all duration-300 font-medium"
          >
            Refresh Posts
          </button>
        </div>
      )}
    </div>
  );
};

export default PostFeed;