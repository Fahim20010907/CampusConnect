"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/Authcontext";
import Swal from "sweetalert2";

export default function GroupChatWindow({ 
  courseGroup, 
  onMessageSent = null,
  fullScreen = false 
}) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch group messages
  useEffect(() => {
    if (!courseGroup._id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/messages/groups/${courseGroup._id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch messages");

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load messages",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Join group room
    if (socket) {
      socket.emit("join_group", courseGroup._id);

      const handleReceiveGroupMessage = (data) => {
        if (data.groupId === courseGroup._id) {
          setMessages((prev) => [
            ...prev,
            {
              _id: Math.random(),
              senderId: data.senderId,
              content: data.message.content,
              createdAt: data.timestamp,
            },
          ]);
        }
      };

      socket.on("receive_group_message", handleReceiveGroupMessage);

      return () => {
        socket.off("receive_group_message", handleReceiveGroupMessage);
        socket.emit("leave_group", courseGroup._id);
      };
    }
  }, [courseGroup._id, socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setSending(true);

      // Optimistic UI
      const optimisticMessage = {
        _id: Date.now(),
        senderId: { _id: user.id, name: user.name, avatar: user.avatar },
        content: newMessage,
        createdAt: new Date(),
        optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");

      // Send to server
      const response = await fetch("/api/messages/groups/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          groupId: courseGroup._id,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      // Replace optimistic message
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === optimisticMessage._id ? data.message : msg
        )
      );

      // Emit to socket
      if (socket && isConnected) {
        socket.emit("send_group_message", {
          groupId: courseGroup._id,
          message: data.message,
          senderId: user.id,
        });
      }

      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error("Error sending message:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to send message",
      });

      setMessages((prev) =>
        prev.filter((msg) => msg._id !== Date.now())
      );
      setNewMessage(newMessage);
    } finally {
      setSending(false);
    }
  };

  if (!fullScreen) {
    // Compact mode
    return (
      <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 z-50">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <h3 className="font-semibold">{courseGroup?.courseName || "Group Chat"}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  msg.senderId._id === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.senderId._id === user?.id
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {msg.senderId._id !== user?.id && (
                    <p className="text-xs font-bold mb-1">
                      {msg.senderId.name}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </div>
    );
  }

  // Full screen mode
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{courseGroup?.courseName}</h2>
          <p className="text-sm opacity-90">
            {courseGroup?.memberCount || 0} members
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${
                msg.senderId._id === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex gap-3 max-w-md">
                {msg.senderId._id !== user?.id && (
                  <img
                    src={msg.senderId.avatar || "/default-avatar.png"}
                    alt={msg.senderId.name}
                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                  />
                )}
                <div
                  className={`px-4 py-3 rounded-lg ${
                    msg.senderId._id === user?.id
                      ? "bg-green-600 text-white"
                      : "bg-gray-300 text-gray-900"
                  }`}
                >
                  {msg.senderId._id !== user?.id && (
                    <p className="text-xs font-bold mb-1">
                      {msg.senderId.name}
                    </p>
                  )}
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-70 block mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-6 border-t border-gray-200 bg-white flex gap-4"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
