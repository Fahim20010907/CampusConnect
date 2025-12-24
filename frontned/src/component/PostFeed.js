"use client"

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import { formatDistanceToNow } from "date-fns";

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          userEmail: user.email
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId) => {
    if (!user || !commentInputs[postId]?.trim()) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/posts/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: commentInputs[postId],
          userEmail: user.email
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Clear comment input
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const updateCommentInput = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleKeyPress = (e, postId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment(postId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-[100px] py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Community Feed</h1>
        <p className="text-gray-600 mt-2">Stay updated with what's happening around you</p>
      </div>

      {/* Create Post Card */}
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
            <button
              onClick={() => router.push("/create-post")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
              
              {/* Post Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 overflow-hidden ring-2 ring-white ring-offset-2 shadow-lg">
                        {post.author?.profilePicture ? (
                          <img src={post.author.profilePicture} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                            {post.author?.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
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
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Public
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
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
                    <div className={`grid gap-3 ${
                      post.images.length === 1 ? "grid-cols-1" :
                      post.images.length === 2 ? "grid-cols-2" :
                      "grid-cols-2"
                    }`}>
                      {post.images.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative rounded-xl overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-transform duration-300"
                        >
                          <img
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-72 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                        <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                        <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                        <div className="w-7 h-7 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></div>
                      </div>
                      <span className="ml-2 font-medium">{post.likes?.length || 0} likes</span>
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">{post.comments?.length || 0} comments</span>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {Math.floor(Math.random() * 500) + 50} views
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-1 py-4">
                  <button
                    onClick={() => handleLike(post._id)}
                    className="flex items-center justify-center space-x-2 py-3 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all duration-200 group"
                  >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium">Like</span>
                  </button>
                  
                  <button className="flex items-center justify-center space-x-2 py-3 rounded-xl hover:bg-green-50 text-gray-700 hover:text-green-600 transition-all duration-200 group">
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">Comment</span>
                  </button>
                  
                  <button className="flex items-center justify-center space-x-2 py-3 rounded-xl hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-all duration-200 group">
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="font-medium">Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex space-x-3">
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
                          value={commentInputs[post._id] || ""}
                          onChange={(e) => updateCommentInput(post._id, e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, post._id)}
                          placeholder="Write a comment..."
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                          rows="2"
                        />
                        <button
                          onClick={() => handleComment(post._id)}
                          disabled={!commentInputs[post._id]?.trim()}
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
                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold text-gray-700">Recent Comments</h4>
                      {post.comments.slice(0, 3).map((comment, index) => (
                        <div key={index} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                              {comment.user?.profilePicture ? (
                                <img src={comment.user.profilePicture} alt={comment.user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs bg-blue-500">
                                  {comment.user?.name?.charAt(0) || "U"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-2xl p-3">
                              <div className="flex justify-between items-start">
                                <span className="font-semibold text-sm text-gray-800">
                                  {comment.user?.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                              <div className="flex items-center space-x-3 mt-2">
                                <button className="text-xs text-gray-500 hover:text-blue-600">Like</button>
                                <button className="text-xs text-gray-500 hover:text-blue-600">Reply</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {post.comments.length > 3 && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View all {post.comments.length} comments
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {posts.length > 0 && (
        <div className="mt-10 text-center">
          <button 
            onClick={fetchPosts}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl border border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all duration-300 font-medium"
          >
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
};

export default PostFeed;