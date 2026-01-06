"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthContext } from "@/context/Authcontext";
import axios from "axios";

const ProfilePage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const {id}=useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followingStatus, setFollowingStatus] = useState({}); // key: userId, value: boolean

  // Fetch all users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/users`);
        if (res.data.success) {
          const allUsers = res.data.data;

          // Remove current user from the list for follow/unfollow
          const filteredUsers = allUsers.filter(
            (u) => u._id !== id
          );
          setUsers(filteredUsers);

          // Set initial following status
          const status = {};
          filteredUsers.forEach((u) => {
            status[u._id] = u.followers?.some(
              (f) => f._id.toString() === id
            );
          });
          setFollowingStatus(status);
        } else {
          setError("Failed to load users.");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUsers();
  }, [currentUser, API_URL]);

  const handleFollowToggle = async (targetUserId) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/users/follow`, {
        userId: id,
        targetUserId,
      });

      if (res.data.success) {
        const isFollowingNow = res.data.data.isFollowing;

        setFollowingStatus((prev) => ({
          ...prev,
          [targetUserId]: isFollowingNow,
        }));

        // Update followers count locally
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u._id === targetUserId) {
              const followers = isFollowingNow
                ? [...(u.followers || []), { _id: id}]
                : (u.followers || []).filter(
                    (f) => f._id.toString() !== id
                  );
              return { ...u, followers };
            }
            return u;
          })
        );
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      setError("Failed to update follow status.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4 space-y-6">
      {/* Current User Profile */}
      {currentUser && (
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center overflow-hidden mb-4">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-green-600 font-bold text-2xl">
                {getInitials(currentUser.name)}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            {currentUser.name}
          </h2>
          <p className="text-gray-500 text-sm">{currentUser.email}</p>
        </div>
      )}

      {/* Other Users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <div
            key={u._id}
            className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center overflow-hidden mb-4">
              {u.profilePicture ? (
                <img
                  src={u.profilePicture}
                  alt={u.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-600 font-bold text-2xl">
                  {getInitials(u.name)}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{u.name}</h2>
            <p className="text-gray-500 text-sm">{u.email}</p>
            {u.department && (
              <p className="text-gray-400 text-sm">{u.department}</p>
            )}
            <div className="flex justify-center space-x-4 mt-2">
              <span>
                <strong>{u.followers?.length || 0}</strong> Followers
              </span>
              <span>
                <strong>{u.following?.length || 0}</strong> Following
              </span>
            </div>

            <button
              onClick={() => handleFollowToggle(u._id)}
              className={`mt-4 px-6 py-2 rounded-lg font-medium transition-colors ${
                followingStatus[u._id]
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {followingStatus[u._id] ? "Unfollow" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
