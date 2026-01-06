"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import Swal from "sweetalert2";

export default function ChatList({ onSelectConversation, selectedId = null }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages/conversations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch conversations");

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load conversations",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p._id !== user?.id);
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = getOtherParticipant(conv);
    return otherParticipant?.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  const getUnreadCount = (conversation) => {
    const unreadMap = conversation.unreadCount || {};
    return unreadMap[user?.id] || 0;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const unreadCount = getUnreadCount(conversation);

            return (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition flex items-center gap-3 ${
                  selectedId === conversation._id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={otherParticipant?.avatar || "/default-avatar.png"}
                    alt={otherParticipant?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`font-semibold text-gray-900 truncate ${
                      unreadCount > 0 ? "font-bold" : ""
                    }`}
                  >
                    {otherParticipant?.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500">
                    {conversation.lastMessageTime
                      ? new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* New Message Button */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
          + New Message
        </button>
      </div>
    </div>
  );
}
