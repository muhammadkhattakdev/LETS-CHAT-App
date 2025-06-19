import React, { useState, useRef, useEffect } from "react";
import { Search, X, MessageCircle, UserPlus, Users } from "lucide-react";
import LoadingSpinner from "../../../loadingSpinner/loadingSpinner";
import PrimaryButton from "../../../primaryButton/primaryButton";
import "./style.css";

const UserSearchModal = ({
  searchQuery,
  searchResults,
  isSearching,
  onUserSelect,
  onClose,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || "");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    // Focus search input when modal opens
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Close modal on Escape key
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleUserClick = (user) => {
    if (showGroupForm) {
      // Toggle user selection for group creation
      setSelectedUsers((prev) => {
        const isSelected = prev.some((u) => u.id === user.id);
        if (isSelected) {
          return prev.filter((u) => u.id !== user.id);
        } else {
          return [...prev, user];
        }
      });
    } else {
      // Direct chat with user
      onUserSelect(user);
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) {
      // Switch to group creation mode
      setShowGroupForm(true);
      return;
    }

    if (!groupName.trim()) {
      return;
    }

    // Create group with selected users
    const groupData = {
      chatName: groupName.trim(),
      participantIds: selectedUsers.map((u) => u.id),
    };

    // TODO: Integrate with group creation
    console.log("Create group:", groupData);
    onClose();
  };

  const isUserSelected = (user) => {
    return selectedUsers.some((u) => u.id === user.id);
  };

  return (
    <div className="user-search-modal-overlay">
      <div className="user-search-modal" ref={modalRef}>
        {/* Header */}
        <div className="user-search-modal__header">
          <div className="user-search-modal__title-section">
            <h2 className="user-search-modal__title">
              {showGroupForm ? "Create Group Chat" : "Start New Chat"}
            </h2>
            <p className="user-search-modal__subtitle">
              {showGroupForm
                ? `${selectedUsers.length} member${
                    selectedUsers.length !== 1 ? "s" : ""
                  } selected`
                : "Search for people to start chatting with"}
            </p>
          </div>
          <button
            className="user-search-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="user-search-modal__search">
          <div className="user-search-modal__search-container">
            <Search size={20} className="user-search-modal__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                showGroupForm ? "Search people to add..." : "Search people..."
              }
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="user-search-modal__search-input"
            />
            {localSearchQuery && (
              <button
                className="user-search-modal__search-clear"
                onClick={() => setLocalSearchQuery("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Group Name Input (when creating group) */}
        {showGroupForm && (
          <div className="user-search-modal__group-form">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="user-search-modal__group-input"
              maxLength={100}
            />
          </div>
        )}

        {/* Selected Users (when creating group) */}
        {showGroupForm && selectedUsers.length > 0 && (
          <div className="user-search-modal__selected-users">
            <h3 className="user-search-modal__selected-title">
              Selected Members
            </h3>
            <div className="user-search-modal__selected-list">
              {selectedUsers.map((user) => (
                <div key={user.id} className="user-search-modal__selected-user">
                  <div className="user-search-modal__selected-avatar">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="user-search-modal__selected-avatar-image"
                      />
                    ) : (
                      <div className="user-search-modal__selected-avatar-fallback">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="user-search-modal__selected-name">
                    {user.firstName} {user.lastName}
                  </span>
                  <button
                    className="user-search-modal__selected-remove"
                    onClick={() =>
                      setSelectedUsers((prev) =>
                        prev.filter((u) => u.id !== user.id)
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="user-search-modal__results">
          {isSearching ? (
            <div className="user-search-modal__loading">
              <LoadingSpinner size="medium" />
              <span>Searching...</span>
            </div>
          ) : localSearchQuery.trim() && searchResults.length === 0 ? (
            <div className="user-search-modal__empty">
              <div className="user-search-modal__empty-icon">🔍</div>
              <h3 className="user-search-modal__empty-title">No users found</h3>
              <p className="user-search-modal__empty-description">
                Try searching with a different username or email
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="user-search-modal__user-list">
              {searchResults.map((user) => {
                const isSelected = isUserSelected(user);
                return (
                  <div
                    key={user.id}
                    className={`user-search-modal__user-item ${
                      isSelected ? "user-search-modal__user-item--selected" : ""
                    }`}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="user-search-modal__user-avatar">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="user-search-modal__user-avatar-image"
                        />
                      ) : (
                        <div className="user-search-modal__user-avatar-fallback">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                      )}
                      {user.isOnline && (
                        <div className="user-search-modal__user-status online" />
                      )}
                    </div>

                    <div className="user-search-modal__user-info">
                      <h4 className="user-search-modal__user-name">
                        {user.firstName} {user.lastName}
                      </h4>
                      <p className="user-search-modal__user-username">
                        @{user.username}
                      </p>
                    </div>

                    <div className="user-search-modal__user-action">
                      {showGroupForm ? (
                        <div
                          className={`user-search-modal__checkbox ${
                            isSelected
                              ? "user-search-modal__checkbox--checked"
                              : ""
                          }`}
                        >
                          {isSelected && <span>✓</span>}
                        </div>
                      ) : (
                        <MessageCircle
                          size={20}
                          className="user-search-modal__chat-icon"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !localSearchQuery.trim() ? (
            <div className="user-search-modal__welcome">
              <div className="user-search-modal__welcome-icon">
                <Users size={48} />
              </div>
              <h3 className="user-search-modal__welcome-title">
                {showGroupForm
                  ? "Create a Group Chat"
                  : "Find People to Chat With"}
              </h3>
              <p className="user-search-modal__welcome-description">
                {showGroupForm
                  ? "Search and select people to add to your group chat"
                  : "Search by username, name, or email to start a conversation"}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="user-search-modal__footer">
          {!showGroupForm ? (
            <div className="user-search-modal__actions">
              <PrimaryButton
                variant="outline"
                onClick={() => setShowGroupForm(true)}
                icon={<Users size={20} />}
              >
                Create Group
              </PrimaryButton>
            </div>
          ) : (
            <div className="user-search-modal__actions">
              <PrimaryButton
                variant="outline"
                onClick={() => {
                  setShowGroupForm(false);
                  setSelectedUsers([]);
                  setGroupName("");
                }}
              >
                Back
              </PrimaryButton>
              <PrimaryButton
                variant="primary"
                onClick={handleCreateGroup}
                disabled={selectedUsers.length === 0 || !groupName.trim()}
                icon={<UserPlus size={20} />}
              >
                Create Group ({selectedUsers.length})
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
