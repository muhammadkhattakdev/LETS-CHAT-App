import React from "react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { Pin, Volume2, VolumeX, Check, CheckCheck } from "lucide-react";
import { useSocket } from "../../../socketContext/socketContext";
import { useChat } from "../../../chatContext/chatContext";
import { useAuth } from "../../../authContext/authContext";
import "./style.css";

const ChatListItem = ({ chat, isActive, onClick }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { getChatUnreadCount } = useChat();

  if (!chat) return null;

  const isPrivateChat = chat.chatType === "private";
  const unreadCount = getChatUnreadCount(chat.id);

  // For private chats, get the other participant
  const otherParticipant = isPrivateChat
    ? chat.participants?.find((p) => p.id !== user?.id)
    : null;

  const isOnline =
    isPrivateChat && otherParticipant
      ? isUserOnline(otherParticipant.id)
      : false;

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffInDays < 7) {
        return format(date, "EEE"); // Mon, Tue, etc.
      } else {
        return format(date, "dd/MM/yy");
      }
    }
  };

  // Format last message
  const formatLastMessage = (message) => {
    if (!message) return "No messages yet";

    const isOwnMessage = message.sender?.id === user?.id;
    const senderPrefix = isPrivateChat
      ? isOwnMessage
        ? "You: "
        : ""
      : isOwnMessage
      ? "You: "
      : `${message.sender?.firstName || "Someone"}: `;

    if (message.messageType === "image") {
      return `${senderPrefix}📷 Photo`;
    } else if (message.messageType === "video") {
      return `${senderPrefix}🎥 Video`;
    } else if (message.messageType === "audio") {
      return `${senderPrefix}🎵 Voice message`;
    } else if (
      message.messageType === "document" ||
      message.messageType === "file"
    ) {
      return `${senderPrefix}📄 Document`;
    } else if (message.isDeleted) {
      return `${senderPrefix}This message was deleted`;
    } else {
      return `${senderPrefix}${message.content || ""}`;
    }
  };

  // Get read status for last message
  const getMessageReadStatus = (message) => {
    if (
      !message ||
      message.sender?.id !== user?.id ||
      isPrivateChat === false
    ) {
      return null;
    }

    const hasBeenRead = message.readBy && message.readBy.length > 0;
    return hasBeenRead ? "read" : "sent";
  };

  const lastMessageTime = chat.lastMessage?.createdAt || chat.lastActivity;
  const readStatus = getMessageReadStatus(chat.lastMessage);

  return (
    <div
      className={`chat-list-item ${isActive ? "chat-list-item--active" : ""} ${
        unreadCount > 0 ? "chat-list-item--unread" : ""
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="chat-list-item__avatar">
        {isPrivateChat ? (
          // Private chat avatar
          otherParticipant?.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={chat.name}
              className="chat-list-item__avatar-image"
            />
          ) : (
            <div className="chat-list-item__avatar-fallback">
              {otherParticipant?.firstName?.[0]}
              {otherParticipant?.lastName?.[0]}
            </div>
          )
        ) : // Group chat avatar
        chat.avatar ? (
          <img
            src={chat.avatar}
            alt={chat.name}
            className="chat-list-item__avatar-image"
          />
        ) : (
          <div className="chat-list-item__avatar-fallback chat-list-item__avatar-fallback--group">
            {chat.name?.[0]?.toUpperCase()}
          </div>
        )}

        {/* Online indicator for private chats */}
        {isPrivateChat && (
          <div
            className={`chat-list-item__status-indicator ${
              isOnline ? "online" : "offline"
            }`}
          />
        )}

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div className="chat-list-item__unread-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </div>

      <div className="chat-list-item__content">
        <div className="chat-list-item__header">
          <div className="chat-list-item__name-container">
            <h3 className="chat-list-item__name">{chat.name}</h3>
            <div className="chat-list-item__indicators">
              {chat.isPinned && (
                <Pin size={14} className="chat-list-item__pin-icon" />
              )}
              {chat.isMuted && (
                <VolumeX size={14} className="chat-list-item__mute-icon" />
              )}
            </div>
          </div>

          <div className="chat-list-item__timestamp">
            {formatTimestamp(lastMessageTime)}
          </div>
        </div>

        <div className="chat-list-item__message">
          <div className="chat-list-item__message-content">
            <span className="chat-list-item__message-text">
              {formatLastMessage(chat.lastMessage)}
            </span>
          </div>

          <div className="chat-list-item__message-status">
            {readStatus === "sent" && (
              <Check size={16} className="chat-list-item__check-icon" />
            )}
            {readStatus === "read" && (
              <CheckCheck
                size={16}
                className="chat-list-item__check-icon chat-list-item__check-icon--read"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
