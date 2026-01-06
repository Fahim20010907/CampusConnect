"use client";

import React, { useState } from "react";
import ChatList from "../component/ChatList";
import ChatWindow from "../component/ChatWindow";
import { useAuth } from "../context/Authcontext";
import Swal from "sweetalert2";

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowNewMessage(false);
  };

  const handleNewMessage = async () => {
    setShowNewMessage(true);
  };

  const handleSearchUser = async (e) => {
    const value = e.target.value;
    setSearchUser(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(value)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleStartConversation = async (recipientId) => {
    try {
      const response = await fetch("/api/messages/conversation/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ recipientId }),
      });

      if (!response.ok) throw new Error("Failed to create conversation");

      const data = await response.json();
      setSelectedConversation(data.conversation);
      setShowNewMessage(false);
      setSearchUser("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to start conversation",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to access messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <ChatList
        onSelectConversation={handleSelectConversation}
        selectedId={selectedConversation?._id}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {showNewMessage ? (
          <div className="flex-1 flex flex-col p-6">
            <h2 className="text-2xl font-bold mb-6">Start a New Conversation</h2>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search users..."
                value={searchUser}
                onChange={handleSearchUser}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {searching && <p className="text-gray-500">Searching...</p>}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result._id}
                    onClick={() => handleStartConversation(result._id)}
                    className="w-full max-w-md flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <img
                      src={result.avatar || "/default-avatar.png"}
                      alt={result.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <p className="font-semibold">{result.name}</p>
                      <p className="text-sm text-gray-600">{result.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchUser && searchResults.length === 0 && !searching && (
              <p className="text-gray-500">No users found</p>
            )}
          </div>
        ) : selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onMessageSent={() => {
              // Refresh conversation list
            }}
            fullScreen={true}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-2xl mb-4">💬</p>
              <p className="text-lg font-semibold mb-2">No conversation selected</p>
              <p className="text-sm mb-6">Select a conversation or start a new one</p>
              <button
                onClick={handleNewMessage}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Start Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
