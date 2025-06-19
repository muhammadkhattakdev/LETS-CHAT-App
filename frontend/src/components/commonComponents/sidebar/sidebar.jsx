import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search,
  MessageSquarePlus,
  Settings,
  MoreVertical,
  Users,
  UserPlus,
  LogOut,
  User,
  Bell,
  BellOff,
  Pin,
  Archive,
} from "lucide-react";
import { useAuth } from "../authContext/authContext";
import { useChat } from "../chatContext/chatContext";
import { useSocket } from "../socketContext/socketContext";
import ChatListItem from "./sidebarComponents/chatListItem/chatListItem";
import UserSearchModal from "./sidebarComponents/userSearchModel/userSearchModal";
import ProfileModal from "./sidebarComponents/profileModal/profileModal";
import "./style.css";
import LoadingSpinner from "../loadingSpinner/loadingSpinner";

const Sidebar = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { user, logout, userDisplayName, userInitials } = useAuth();
  const {
    chats,
    searchResults,
    isSearching,
    searchUsers,
    createPrivateChat,
    setCurrentChat,
    getTotalUnreadCount,
  } = useChat();
  const { isUserOnline } = useSocket();

  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search input changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim() && searchFocused) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, searchUsers, searchFocused]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      setShowSearchModal(true);
    } else {
      setShowSearchModal(false);
    }
  };

  const handleChatSelect = (chat) => {
    setCurrentChat(chat);
    navigate(`/chat/${chat.id}`);
    setSearchQuery("");
    setShowSearchModal(false);
  };

  const handleUserSelect = async (selectedUser) => {
    try {
      const newChat = await createPrivateChat(selectedUser.id);
      if (newChat) {
        setCurrentChat(newChat);
        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }

    setSearchQuery("");
    setShowSearchModal(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchModal(false);
    searchInputRef.current?.focus();
  };

  const handleSearchFocus = () => {
    console.log("Search Input focused");
  };

  const handleSearchBlur = () => {
    console.log("Search Input focused");
  };
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnreadCount = getTotalUnreadCount();

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__user" ref={userMenuRef}>
          <div
            className="sidebar__user-info"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="sidebar__avatar">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={userDisplayName}
                  className="sidebar__avatar-image"
                />
              ) : (
                <div className="sidebar__avatar-fallback">{userInitials}</div>
              )}
              <div
                className={`sidebar__status-indicator ${
                  isUserOnline(user?.id) ? "online" : "offline"
                }`}
              />
            </div>
            <div className="sidebar__user-details">
              <h2 className="sidebar__user-name">{userDisplayName}</h2>
              <p className="sidebar__user-status">
                {isUserOnline(user?.id) ? "Online" : "Offline"}
              </p>
            </div>
            <MoreVertical size={20} className="sidebar__menu-icon" />
          </div>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="sidebar__user-menu">
              <button
                className="sidebar__menu-item"
                onClick={() => {
                  setShowProfileModal(true);
                  setShowUserMenu(false);
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              <button
                className="sidebar__menu-item"
                onClick={() => {
                  navigate("/settings");
                  setShowUserMenu(false);
                }}
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="sidebar__menu-divider" />
              <button
                className="sidebar__menu-item sidebar__menu-item--danger"
                onClick={() => {
                  handleLogout();
                  setShowUserMenu(false);
                }}
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sidebar__actions">
          <button
            className="sidebar__action-btn"
            onClick={() => setShowSearchModal(true)}
            title="New Chat"
          >
            <MessageSquarePlus size={20} />
          </button>
          <button
            className="sidebar__action-btn"
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sidebar__search">
        <div className="sidebar__search-container">
          <Search size={20} className="sidebar__search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search Here..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="sidebar__search-input"
          />
          {searchQuery && (
            <button
              className="sidebar__search-clear"
              onClick={clearSearch}
              type="button"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="sidebar__chat-list">
        {filteredChats.length === 0 ? (
          <div className="sidebar__empty-state">
            <MessageSquarePlus size={48} className="sidebar__empty-icon" />
            <h3 className="sidebar__empty-title">No chats yet</h3>
            <p className="sidebar__empty-description">
              Start a conversation by searching for users or creating a group
            </p>
            <button
              className="sidebar__empty-button"
              onClick={() => setShowSearchModal(true)}
            >
              <UserPlus size={16} />
              Start Chat
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={chatId === chat.id}
              onClick={() => handleChatSelect(chat)}
            />
          ))
        )}
      </div>

      {/* Unread Count Badge */}
      {totalUnreadCount > 0 && (
        <div className="sidebar__unread-badge">
          {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <UserSearchModal
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onUserSelect={handleUserSelect}
          onClose={() => {
            setShowSearchModal(false);
            setSearchQuery("");
          }}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};

export default Sidebar;
