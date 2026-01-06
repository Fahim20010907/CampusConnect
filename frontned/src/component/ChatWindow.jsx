"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/Authcontext";
import Swal from "sweetalert2";

export default function ChatWindow({ 
  conversation, 
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

  const otherParticipant = conversation.participants.find(
    (p) => p._id !== user?.id
  );

  // Fetch conversation messages
  useEffect(() => {
    if (!conversation._id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/messages/conversations/${conversation._id}`,
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

    // Join conversation room for real-time updates
    if (socket) {
      socket.emit("join_conversation", conversation._id);

      const handleReceiveMessage = (data) => {
        if (data.conversationId === conversation._id) {
          setMessages((prev) => [
            ...prev,
            {
              _id: Math.random(),
              senderId: { _id: data.senderId },
              content: data.message.content,
              createdAt: data.timestamp,
            },
          ]);
        }
      };

      socket.on("receive_message", handleReceiveMessage);

      return () => {
        socket.off("receive_message", handleReceiveMessage);
        socket.emit("leave_conversation", conversation._id);
      };
    }
  }, [conversation._id, socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setSending(true);

      // Optimistic UI - add message immediately
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
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === optimisticMessage._id ? data.message : msg
        )
      );

      // Emit to socket for real-time delivery
      if (socket && isConnected) {
        socket.emit("send_message", {
          conversationId: conversation._id,
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

      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== Date.now())
      );
      setNewMessage(newMessage); // Restore message text
    } finally {
      setSending(false);
    }
  };

  if (!fullScreen) {
    // Compact bottom-right chat window
    return (
      <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 z-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{otherParticipant?.name || "Chat"}</h3>
            <p className="text-xs opacity-90">
              {isConnected ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet. Start the conversation!
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
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  } ${msg.optimistic ? "opacity-75" : ""}`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </div>
    );
  }

  // Full screen chat window
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{otherParticipant?.name || "Chat"}</h2>
          <p className="text-sm opacity-90">
            {isConnected ? "Online" : "Offline"}
          </p>
        </div>
        <div className="flex gap-4">
          <button className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition">
            📞
          </button>
          <button className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition">
            ℹ️
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
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
              <div
                className={`max-w-md px-4 py-3 rounded-lg ${
                  msg.senderId._id === user?.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-900"
                } ${msg.optimistic ? "opacity-75" : ""}`}
              >
                {msg.senderId._id !== user?.id && (
                  <p className="text-xs font-semibold mb-1">
                    {msg.senderId.name}
                  </p>
                )}
                <p>{msg.content}</p>
                <span className="text-xs opacity-70 block mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-6 border-t border-gray-200 bg-white flex gap-4"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
