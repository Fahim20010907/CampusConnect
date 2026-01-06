"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "@/context/Authcontext";
import Swal from "sweetalert2";
import Link from "next/link";

// Loading Skeleton Component
const PostSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="flex gap-4">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="h-8 bg-gray-200 rounded w-20"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function FeedComponent({ compact = false, limit = 10 }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
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
    async (sortValue = "recent", pageNum = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts?sort=${sortValue}&limit=${limit}&page=${pageNum}`
        );

        const data = await response.json();

        if (data.success) {
          setPosts(data.data);
          setPagination(data.pagination);
        } else {
          setError(data.message || "Failed to load posts");
          setPosts([]);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // Initial fetch
  useEffect(() => {
    fetchPosts(sortBy, 1);
    setPage(1);
  }, [fetchPosts, sortBy]);

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    localStorage.setItem("feedSortBy", newSort);
    setPage(1);
    fetchPosts(newSort, 1);
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
        setPosts(
          posts.map((post) => (post._id === postId ? data.data : post))
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
      Swal.fire("Error", "Failed to like post", "error");
    }
  };

  // Render post card
  const PostCard = ({ post }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {post.authorProfilePicture ? (
            <img
              src={post.authorProfilePicture}
              alt={post.authorName}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {post.authorName?.charAt(0) || "U"}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">
              {post.authorName || "Unknown"}
            </h3>
            <p className="text-gray-500 text-xs md:text-sm">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
          {post.category}
        </span>
      </div>

      {/* Content */}
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 line-clamp-2">
        {post.title}
      </h2>
      <p className="text-gray-600 text-sm md:text-base line-clamp-3 mb-3 md:mb-4">
        {post.content}
      </p>

      {/* Image */}
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-40 md:h-64 object-cover rounded-lg mb-3 md:mb-4"
        />
      )}

      {/* Stats */}
      <div className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4 flex gap-3 md:gap-4">
        <span>👁️ {post.views || 0}</span>
        <span>❤️ {post.likeCount || 0}</span>
        <span>💬 {post.commentCount || 0}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 md:pt-4 border-t border-gray-200">
        <button
          onClick={() => handleLike(post._id)}
          className="flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium text-sm md:text-base"
        >
          <span>❤️</span>
          <span className="hidden sm:inline">Like</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium text-sm md:text-base">
          <span>💬</span>
          <span className="hidden sm:inline">Comment</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium text-sm md:text-base">
          <span>📤</span>
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header with Sort */}
      <div className="mb-4 md:mb-6 flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Feed</h2>
          <p className="text-gray-500 text-sm">
            {sortBy === "recent"
              ? "Posts sorted by newest first"
              : "Posts sorted by engagement"}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          <label className="text-gray-600 font-medium text-sm md:text-base">
            Sort:
          </label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer hover:border-gray-400 transition text-sm md:text-base"
          >
            <option value="recent">📅 Recent</option>
            <option value="popular">🔥 Popular</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && <PostSkeleton count={3} />}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">❌ {error}</p>
          <button
            onClick={() => fetchPosts(sortBy, 1)}
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

      {/* Posts */}
      {!loading && posts.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}

          {/* View All Link */}
          {compact && pagination.total > limit && (
            <Link
              href="/feed"
              className="block text-center py-3 text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base"
            >
              View all posts →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
