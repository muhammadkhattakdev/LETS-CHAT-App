import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Search, 
  Pin, 
  Archive, 
  Bell, 
  BellOff,
  UserPlus,
  Settings,
  Trash2,
  Info
} from 'lucide-react';
import { useSocket } from '../../../../commonComponents/socketContext/socketContext';
import { useAuth } from '../../../../commonComponents/authContext/authContext';
import { formatDistanceToNow } from 'date-fns';
import './style.css';

const ChatHeader = ({ chat }) => {
  const { user } = useAuth();
  const { isUserOnline, getTypingUsersText } = useSocket();
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!chat) return null;

  const isPrivateChat = chat.chatType === 'private';
  const isGroupChat = chat.chatType === 'group';

  // For private chats, get the other participant
  const otherParticipant = isPrivateChat 
    ? chat.participants?.find(p => p.id !== user?.id) 
    : null;

  const isOnline = isPrivateChat 
    ? isUserOnline(otherParticipant?.id) 
    : false;

  const getStatusText = () => {
    if (isPrivateChat) {
      if (isOnline) {
        return 'Online';
      } else if (otherParticipant?.lastSeen) {
        return `Last seen ${formatDistanceToNow(new Date(otherParticipant.lastSeen))} ago`;
      } else {
        return 'Offline';
      }
    } else {
      const participantCount = chat.participants?.length || 0;
      const onlineCount = chat.participants?.filter(p => isUserOnline(p.id)).length || 0;
      return `${participantCount} members, ${onlineCount} online`;
    }
  };

  const typingText = getTypingUsersText(chat.id, user?.id);

  const handleMenuAction = (action) => {
    setShowMenu(false);
    
    switch (action) {
      case 'search':
        setShowSearchDialog(true);
        break;
      case 'pin':
        // Handle pin/unpin
        console.log('Pin/unpin chat');
        break;
      case 'mute':
        // Handle mute/unmute
        console.log('Mute/unmute chat');
        break;
      case 'archive':
        // Handle archive
        console.log('Archive chat');
        break;
      case 'addMember':
        // Handle add member (group only)
        console.log('Add member');
        break;
      case 'chatInfo':
        // Handle chat info
        console.log('Show chat info');
        break;
      case 'delete':
        // Handle delete chat
        console.log('Delete chat');
        break;
      default:
        break;
    }
  };

  return (
    <div className="chat-header">
      <div className="chat-header__main">
        {/* Avatar and Info */}
        <div className="chat-header__info">
          <div className="chat-header__avatar">
            {isPrivateChat ? (
              otherParticipant?.avatar ? (
                <img 
                  src={otherParticipant.avatar} 
                  alt={chat.name}
                  className="chat-header__avatar-image"
                />
              ) : (
                <div className="chat-header__avatar-fallback">
                  {otherParticipant?.firstName?.[0]}{otherParticipant?.lastName?.[0]}
                </div>
              )
            ) : (
              chat.avatar ? (
                <img 
                  src={chat.avatar} 
                  alt={chat.name}
                  className="chat-header__avatar-image"
                />
              ) : (
                <div className="chat-header__avatar-fallback chat-header__avatar-fallback--group">
                  {chat.name?.[0]?.toUpperCase()}
                </div>
              )
            )}
            {isPrivateChat && (
              <div className={`chat-header__status-indicator ${isOnline ? 'online' : 'offline'}`} />
            )}
          </div>

          <div className="chat-header__details">
            <h2 className="chat-header__name">{chat.name}</h2>
            <div className="chat-header__status">
              {typingText ? (
                <span className="chat-header__typing">
                  <span className="typing-dots">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </span>
                  {typingText}
                </span>
              ) : (
                <span className="chat-header__status-text">
                  {getStatusText()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="chat-header__actions">
          {isPrivateChat && (
            <>
              <button 
                className="chat-header__action-btn"
                onClick={() => console.log('Voice call')}
                title="Voice Call"
              >
                <Phone size={20} />
              </button>
              <button 
                className="chat-header__action-btn"
                onClick={() => console.log('Video call')}
                title="Video Call"
              >
                <Video size={20} />
              </button>
            </>
          )}
          
          <button 
            className="chat-header__action-btn"
            onClick={() => handleMenuAction('search')}
            title="Search in Chat"
          >
            <Search size={20} />
          </button>

          <div className="chat-header__menu" ref={menuRef}>
            <button 
              className="chat-header__action-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="More Options"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="chat-header__dropdown">
                <button 
                  className="chat-header__dropdown-item"
                  onClick={() => handleMenuAction('chatInfo')}
                >
                  <Info size={16} />
                  <span>Chat Info</span>
                </button>
                
                <button 
                  className="chat-header__dropdown-item"
                  onClick={() => handleMenuAction('pin')}
                >
                  <Pin size={16} />
                  <span>{chat.isPinned ? 'Unpin' : 'Pin'} Chat</span>
                </button>
                
                <button 
                  className="chat-header__dropdown-item"
                  onClick={() => handleMenuAction('mute')}
                >
                  {chat.isMuted ? <Bell size={16} /> : <BellOff size={16} />}
                  <span>{chat.isMuted ? 'Unmute' : 'Mute'} Notifications</span>
                </button>

                {isGroupChat && (
                  <button 
                    className="chat-header__dropdown-item"
                    onClick={() => handleMenuAction('addMember')}
                  >
                    <UserPlus size={16} />
                    <span>Add Member</span>
                  </button>
                )}
                
                <div className="chat-header__dropdown-divider" />
                
                <button 
                  className="chat-header__dropdown-item"
                  onClick={() => handleMenuAction('archive')}
                >
                  <Archive size={16} />
                  <span>Archive Chat</span>
                </button>
                
                <button 
                  className="chat-header__dropdown-item chat-header__dropdown-item--danger"
                  onClick={() => handleMenuAction('delete')}
                >
                  <Trash2 size={16} />
                  <span>Delete Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      {showSearchDialog && (
        <div className="chat-header__search-overlay">
          <div className="chat-header__search-dialog">
            <div className="chat-header__search-header">
              <h3>Search in this chat</h3>
              <button 
                className="chat-header__search-close"
                onClick={() => setShowSearchDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="chat-header__search-content">
              <input
                type="text"
                placeholder="Search messages..."
                className="chat-header__search-input"
                autoFocus
              />
              <div className="chat-header__search-results">
                {/* Search results would go here */}
                <div className="chat-header__search-empty">
                  Start typing to search messages
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;