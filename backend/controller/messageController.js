import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import User from "../models/user.js";
import CourseGroup from "../models/courseGroup.js";

// Send a message to a conversation (private or group)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    if (!conversationId || !content) {
      return res
        .status(400)
        .json({ message: "Conversation ID and content are required" });
    }

    // Verify user is a participant in this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to send messages in this conversation" });
    }

    // Create the message
    const message = new Message({
      conversationId,
      senderId,
      content,
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    await message.save();

    // Populate sender info
    await message.populate("senderId", "name avatar email");

    // Update conversation's last message info
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content,
      lastMessageTime: new Date(),
      lastMessageSenderId: senderId,
    });

    // Reset unread count for sender, increment for others
    const updatedUnreadCount = new Map(conversation.unreadCount || {});
    updatedUnreadCount.set(senderId, 0);

    conversation.participants.forEach((participantId) => {
      const idStr = participantId.toString();
      if (idStr !== senderId) {
        const currentCount = updatedUnreadCount.get(idStr) || 0;
        updatedUnreadCount.set(idStr, currentCount + 1);
      }
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      unreadCount: updatedUnreadCount,
    });

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('receive_message', {
        conversationId,
        message,
        senderId,
        timestamp: message.createdAt,
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// Get all messages for a conversation
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to view this conversation" });
    }

    // Fetch messages with pagination
    const messages = await Message.find({ conversationId })
      .populate("senderId", "name avatar email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversationId, senderId: { $ne: userId } },
      {
        $addToSet: {
          readBy: { userId, readAt: new Date() },
        },
      }
    );

    // Reset unread count for this user
    const updatedUnreadCount = new Map(conversation.unreadCount || {});
    updatedUnreadCount.set(userId, 0);
    await Conversation.findByIdAndUpdate(conversationId, {
      unreadCount: updatedUnreadCount,
    });

    const total = await Message.countDocuments({ conversationId });

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
};

// Get all conversations for the current user
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name avatar email")
      .populate("lastMessageSenderId", "name")
      .sort({ lastMessageTime: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Error fetching conversations", error: error.message });
  }
};

// Create or get a 1-on-1 conversation between two users
export const getOrCreatePrivateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    if (userId === recipientId) {
      return res.status(400).json({ message: "Cannot start conversation with yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Look for existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      isGroupChat: false,
    }).populate("participants", "name avatar email");

    // If not found, create new conversation
    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, recipientId],
        isGroupChat: false,
        unreadCount: new Map([
          [userId, 0],
          [recipientId, 0],
        ]),
      });
      await conversation.save();
      await conversation.populate("participants", "name avatar email");
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error("Error in conversation creation:", error);
    res.status(500).json({ message: "Error creating/fetching conversation", error: error.message });
  }
};

// Mark all messages in a conversation as read
export const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update messages as read
    await Message.updateMany(
      { conversationId, senderId: { $ne: userId } },
      {
        $addToSet: {
          readBy: { userId, readAt: new Date() },
        },
      }
    );

    // Reset unread count
    const updatedUnreadCount = new Map(conversation.unreadCount || {});
    updatedUnreadCount.set(userId, 0);
    await Conversation.findByIdAndUpdate(conversationId, {
      unreadCount: updatedUnreadCount,
    });

    res.status(200).json({ success: true, message: "Conversation marked as read" });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ message: "Error marking as read", error: error.message });
  }
};

// Delete a message (soft delete - just hide content)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can delete their message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    // Soft delete - just update content
    message.content = "[Message deleted]";
    await message.save();

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Error deleting message", error: error.message });
  }
};

// Edit a message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can edit their message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();
    await message.populate("senderId", "name avatar email");

    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Error editing message", error: error.message });
  }
};

// Get user's course groups (for group chat)
export const getUserCourseGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const courseGroups = await CourseGroup.find({
      members: userId,
    })
      .populate("courseId", "name code")
      .populate("instructor", "name avatar")
      .populate("conversationId")
      .sort({ lastMessageTime: -1 });

    res.status(200).json({ success: true, courseGroups });
  } catch (error) {
    console.error("Error fetching course groups:", error);
    res.status(500).json({ message: "Error fetching course groups", error: error.message });
  }
};

export const enrollInCourseGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, courseName, courseCode, instructorId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    // Find or create course group
    let group = await CourseGroup.findOne({ courseId });
    if (!group) {
      group = new CourseGroup({
        courseId,
        courseName: courseName || "",
        courseCode: courseCode || "",
        instructor: instructorId || null,
        members: [userId],
        memberCount: 1,
      });
      await group.save();
    } else {
      // Add member if not already present
      const isMember = group.members.some((m) => m.toString() === userId);
      if (!isMember) {
        group.members.push(userId);
        group.memberCount = (group.memberCount || 0) + 1;
        await group.save();
      }
    }

    // Ensure a conversation exists for the group
    if (!group.conversationId) {
      const conversation = new Conversation({
        participants: group.members,
        isGroupChat: true,
        groupName: group.courseName || "",
        courseGroupId: group._id,
        unreadCount: new Map(),
      });
      await conversation.save();
      group.conversationId = conversation._id;
      await group.save();
    } else {
      // Also ensure conversation participants are up-to-date
      await Conversation.findByIdAndUpdate(group.conversationId, {
        participants: group.members,
      });
    }

    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("Error enrolling in course group:", error);
    res.status(500).json({ message: "Error enrolling in course group", error: error.message });
  }
};

// Send message to a course group
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;
    const senderId = req.user.id;

    if (!groupId || !content) {
      return res.status(400).json({ message: "Group ID and content are required" });
    }

    const courseGroup = await CourseGroup.findById(groupId);
    if (!courseGroup) {
      return res.status(404).json({ message: "Course group not found" });
    }

    // Verify user is a member of the group
    const isMember = courseGroup.members.some(
      (m) => m.toString() === senderId
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized to send messages in this group" });
    }

    // Get or create conversation for the group
    let conversation = await Conversation.findById(courseGroup.conversationId);
    if (!conversation) {
      conversation = new Conversation({
        participants: courseGroup.members,
        isGroupChat: true,
        groupName: courseGroup.courseName,
        courseGroupId: groupId,
        unreadCount: new Map(),
      });
      await conversation.save();
      courseGroup.conversationId = conversation._id;
      await courseGroup.save();
    }

    // Create the message
    const message = new Message({
      conversationId: conversation._id,
      senderId,
      content,
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    await message.save();
    await message.populate("senderId", "name avatar email");

    // Update group's last message
    courseGroup.lastMessage = content;
    courseGroup.lastMessageTime = new Date();
    await courseGroup.save();

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: content,
      lastMessageTime: new Date(),
      lastMessageSenderId: senderId,
    });

    // Emit via Socket.io to group room
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('receive_group_message', {
        groupId,
        message,
        senderId,
        timestamp: message.createdAt,
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ message: "Error sending group message", error: error.message });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const courseGroup = await CourseGroup.findById(groupId);
    if (!courseGroup) {
      return res.status(404).json({ message: "Course group not found" });
    }

    // Verify user is a member
    const isMember = courseGroup.members.some(
      (m) => m.toString() === userId
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized to view this group" });
    }

    const conversation = await Conversation.findById(courseGroup.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Fetch messages
    const messages = await Message.find({ conversationId: conversation._id })
      .populate("senderId", "name avatar email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark as read
    await Message.updateMany(
      { conversationId: conversation._id, senderId: { $ne: userId } },
      {
        $addToSet: {
          readBy: { userId, readAt: new Date() },
        },
      }
    );

    const total = await Message.countDocuments({ conversationId: conversation._id });

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Error fetching group messages", error: error.message });
  }
};
