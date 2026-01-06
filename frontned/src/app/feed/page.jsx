"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "@/context/Authcontext";
import Swal from "sweetalert2";

const SortingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="flex gap-4">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function Feed() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Load sort preference from localStorage
  useEffect(() => {
    const savedSort = localStorage.getItem("feedSortBy");
    if (savedSort) {
      setSortBy(savedSort);
    }
  }, []);

  // Fetch posts with sorting
  const fetchPosts = useCallback(
    async (sortValue = "recent", page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts?sort=${sortValue}&limit=10&page=${page}`
        );

        const data = await response.json();

        if (data.success) {
          setPosts(data.data);
          setPagination(data.pagination);
        } else {
          setError(data.message || "Failed to load posts");
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch
  useEffect(() => {
    fetchPosts("recent", 1);
  }, [fetchPosts]);

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    localStorage.setItem("feedSortBy", newSort); // Persist to localStorage
    fetchPosts(newSort, 1); // Refetch with new sort, reset to page 1
  };

  // Handle like
  const handleLike = async (postId) => {
    if (!user) {
      Swal.fire("Error", "Please login to like posts", "error");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.uid }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update posts in state
        setPosts(
          posts.map((post) => (post._id === postId ? data.data : post))
        );
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      Swal.fire("Error", "Failed to like post", "error");
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchPosts(sortBy, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Header with Sort Controls */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Feed</h1>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-gray-600 font-medium">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer hover:border-gray-400 transition"
            >
              <option value="recent">📅 Most Recent</option>
              <option value="popular">🔥 Most Popular</option>
            </select>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-gray-600 text-sm mb-4">
          {sortBy === "recent"
            ? "Posts sorted by newest first"
            : "Posts sorted by likes and comments"}
        </p>

        {/* Loading State */}
        {loading && <SortingSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">❌ {error}</p>
            <button
              onClick={() => fetchPosts(sortBy, pagination.page)}
              className="mt-2 text-red-700 underline text-sm hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found</p>
            <p className="text-gray-400 text-sm mt-2">
              Be the first to share something!
            </p>
          </div>
        )}

        {/* Posts List */}
        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {post.authorProfilePicture ? (
                      <img
                        src={post.authorProfilePicture}
                        alt={post.authorName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {post.authorName?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {post.authorName || "Unknown"}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {new Date(post.createdAt).toLocaleDateString()} •{" "}
                        {post.category}
                      </p>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {post.category}
                  </span>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 line-clamp-3">{post.content}</p>
                </div>

                {/* Post Image */}
                {post.image && (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                {/* Post Stats */}
                <div className="text-gray-500 text-sm mb-4 flex gap-4">
                  <span>👁️ {post.views || 0} views</span>
                  <span>❤️ {post.likeCount || 0} likes</span>
                  <span>💬 {post.commentCount || 0} comments</span>
                </div>

                {/* Post Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleLike(post._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium"
                  >
                    <span>❤️</span>
                    Like
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium">
                    <span>💬</span>
                    Comment
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium">
                    <span>📤</span>
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && posts.length > 0 && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-2 rounded-lg transition ${
                  pagination.page === i + 1
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}

        {/* Loading Info */}
        {!loading && posts.length > 0 && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} posts
          </p>
        )}
      </div>
    </div>
  );
}
