"use client";

import React, { useState } from "react";
import GroupChatList from "../component/GroupChatList";
import GroupChatWindow from "../component/GroupChatWindow";
import { useAuth } from "../context/Authcontext";

export default function GroupChatPage() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to access course groups</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <GroupChatList
        onSelectGroup={setSelectedGroup}
        selectedId={selectedGroup?._id}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <GroupChatWindow
            courseGroup={selectedGroup}
            fullScreen={true}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-2xl mb-4">👥</p>
              <p className="text-lg font-semibold mb-2">Select a course group</p>
              <p className="text-sm mb-6">Choose a group to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
