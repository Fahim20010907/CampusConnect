"use client"

import { useState, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const PostCard = ({ post }) => {
  const { user } = useContext(AuthContext);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.uid) || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);

  const handleLike = async () => {
    try {
      // API call to like/unlike
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post._id,
          // Add auth token
        }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post._id,
          content: newComment,
          // Add auth token
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.data]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.author?._id}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 overflow-hidden">
                {post.author?.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {post.author?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            </Link>
            <div>
              <Link href={`/profile/${post.author?._id}`}>
                <h3 className="font-semibold text-gray-800 hover:text-blue-600">
                  {post.author?.name}
                </h3>
              </Link>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                <span>•</span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {post.visibility}
                </span>
              </div>
            </div>
          </div>
          {/* More options button */}
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
        
        {/* Media Gallery */}
        {post.media && post.media.length > 0 && (
          <div className={`mt-4 grid gap-2 ${
            post.media.length === 1 ? "grid-cols-1" :
            post.media.length === 2 ? "grid-cols-2" :
            post.media.length === 3 ? "grid-cols-2" : "grid-cols-2"
          }`}>
            {post.media.map((mediaUrl, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden">
                <img
                  src={mediaUrl}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white"></div>
              </div>
              <span>{likeCount} likes</span>
            </div>
            <div>
              <span>{comments.length} comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-6 py-3 border-t border-gray-100 grid grid-cols-2 gap-2">
        <button
          onClick={handleLike}
          className={`flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors ${
            isLiked ? "text-red-500 bg-red-50" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{isLiked ? "Liked" : "Like"}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-center space-x-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Comment</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          {/* Add Comment */}
          <div className="flex space-x-3 mb-6">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 overflow-hidden">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs">
                    {user?.displayName?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={index} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                    {comment.user?.profilePicture ? (
                      <img
                        src={comment.user.profilePicture}
                        alt={comment.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs bg-blue-500">
                        {comment.user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-sm text-gray-800">
                        {comment.user?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;