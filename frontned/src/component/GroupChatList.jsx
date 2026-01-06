"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import Swal from "sweetalert2";

export default function GroupChatList({ onSelectGroup, selectedId = null }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages/groups", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch groups");

      const data = await response.json();
      setGroups(data.courseGroups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load course groups",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Groups</h2>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No groups found" : "No course groups yet"}
          </div>
        ) : (
          filteredGroups.map((group) => (
            <button
              key={group._id}
              onClick={() => onSelectGroup(group)}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left ${
                selectedId === group._id ? "bg-green-50 border-l-4 border-l-green-600" : ""
              }`}
            >
              {/* Course Icon */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-lg">
                  {group.courseName.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {group.courseName}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    {group.courseCode}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>👥 {group.memberCount} members</span>
                    {group.lastMessage && (
                      <span className="truncate">
                        • {group.lastMessage.substring(0, 20)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
