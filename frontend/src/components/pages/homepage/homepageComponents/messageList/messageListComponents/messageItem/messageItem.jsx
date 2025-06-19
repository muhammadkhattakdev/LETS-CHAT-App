import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  MoreVertical, 
  Reply, 
  Edit, 
  Copy, 
  Trash2, 
  Download,
  Check,
  CheckCheck,
  File,
  Image as ImageIcon,
  Video,
  Music
} from 'lucide-react';
import './style.css';
import { useAuth } from '../../../../../../commonComponents/authContext/authContext';
import { useChat } from '../../../../../../commonComponents/chatContext/chatContext';

const MessageItem = ({ 
  message, 
  isOwn, 
  isGroupedWithPrevious, 
  isGroupedWithNext, 
  showSenderName 
}) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
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

  if (!message) return null;

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    
    switch (action) {
      case 'reply':
        // Handle reply
        console.log('Reply to message:', message.id);
        break;
      case 'edit':
        // Handle edit (only for own messages)
        console.log('Edit message:', message.id);
        break;
      case 'copy':
        // Handle copy text
        if (message.content) {
          navigator.clipboard.writeText(message.content);
        }
        break;
      case 'delete':
        // Handle delete
        console.log('Delete message:', message.id);
        break;
      case 'download':
        // Handle download attachment
        console.log('Download attachment');
        break;
      default:
        break;
    }
  };

  const getReadStatus = () => {
    if (!isOwn || !message.readBy) return null;
    
    const readCount = message.readBy.length;
    if (readCount === 0) return 'sent';
    return 'read';
  };

  const renderAttachment = (attachment) => {
    const { type, url, filename, size } = attachment;

    switch (type) {
      case 'image':
        return (
          <div 
            className="message-item__image"
            onClick={() => setShowImageModal(true)}
          >
            <img 
              src={url} 
              alt={filename}
              className="message-item__image-content"
            />
            <div className="message-item__image-overlay">
              <ImageIcon size={24} />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="message-item__video">
            <video 
              src={url}
              controls
              className="message-item__video-content"
            />
            <div className="message-item__media-info">
              <Video size={16} />
              <span>{filename}</span>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="message-item__audio">
            <div className="message-item__audio-icon">
              <Music size={24} />
            </div>
            <audio 
              src={url}
              controls
              className="message-item__audio-content"
            />
            <div className="message-item__media-info">
              <span>{filename}</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="message-item__file">
            <div className="message-item__file-icon">
              <File size={24} />
            </div>
            <div className="message-item__file-info">
              <div className="message-item__file-name">{filename}</div>
              <div className="message-item__file-size">
                {(size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <button 
              className="message-item__file-download"
              onClick={() => handleMenuAction('download')}
            >
              <Download size={16} />
            </button>
          </div>
        );
    }
  };

  const readStatus = getReadStatus();

  return (
    <div 
      className={`message-item ${isOwn ? 'message-item--own' : 'message-item--other'} ${
        isGroupedWithPrevious ? 'message-item--grouped-previous' : ''
      } ${isGroupedWithNext ? 'message-item--grouped-next' : ''}`}
    >
      {/* Avatar (only for other's messages and when not grouped) */}
      {!isOwn && !isGroupedWithPrevious && (
        <div className="message-item__avatar">
          {message.sender?.avatar ? (
            <img 
              src={message.sender.avatar} 
              alt={message.sender.firstName}
              className="message-item__avatar-image"
            />
          ) : (
            <div className="message-item__avatar-fallback">
              {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
            </div>
          )}
        </div>
      )}

      <div className="message-item__content">
        {/* Sender name (for group chats) */}
        {showSenderName && !isOwn && (
          <div className="message-item__sender-name">
            {message.sender?.firstName} {message.sender?.lastName}
          </div>
        )}

        {/* Reply info */}
        {message.replyTo && (
          <div className="message-item__reply-info">
            <div className="message-item__reply-line"></div>
            <div className="message-item__reply-content">
              <div className="message-item__reply-sender">
                {message.replyTo.sender?.firstName} {message.replyTo.sender?.lastName}
              </div>
              <div className="message-item__reply-text">
                {message.replyTo.content || 'Media message'}
              </div>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className="message-item__bubble">
          {/* Message menu */}
          <div className="message-item__menu" ref={menuRef}>
            <button 
              className="message-item__menu-trigger"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="message-item__menu-dropdown">
                <button 
                  className="message-item__menu-item"
                  onClick={() => handleMenuAction('reply')}
                >
                  <Reply size={16} />
                  <span>Reply</span>
                </button>
                
                {message.content && (
                  <button 
                    className="message-item__menu-item"
                    onClick={() => handleMenuAction('copy')}
                  >
                    <Copy size={16} />
                    <span>Copy</span>
                  </button>
                )}

                {isOwn && (
                  <button 
                    className="message-item__menu-item"
                    onClick={() => handleMenuAction('edit')}
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                )}

                <div className="message-item__menu-divider" />
                
                <button 
                  className="message-item__menu-item message-item__menu-item--danger"
                  onClick={() => handleMenuAction('delete')}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Message content */}
          <div className="message-item__body">
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="message-item__attachments">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="message-item__attachment">
                    {renderAttachment(attachment)}
                  </div>
                ))}
              </div>
            )}

            {/* Text content */}
            {message.content && (
              <div className="message-item__text">
                {message.content}
              </div>
            )}

            {/* Message metadata */}
            <div className="message-item__metadata">
              <span className="message-item__time">
                {formatTime(message.createdAt)}
              </span>
              
              {message.isEdited && (
                <span className="message-item__edited">edited</span>
              )}

              {/* Read status for own messages */}
              {isOwn && readStatus && (
                <div className="message-item__read-status">
                  {readStatus === 'sent' && (
                    <Check size={14} className="message-item__check-icon" />
                  )}
                  {readStatus === 'read' && (
                    <CheckCheck size={14} className="message-item__check-icon message-item__check-icon--read" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && message.attachments?.[0]?.type === 'image' && (
        <div 
          className="message-item__image-modal"
          onClick={() => setShowImageModal(false)}
        >
          <div className="message-item__image-modal-content">
            <img 
              src={message.attachments[0].url} 
              alt={message.attachments[0].filename}
              className="message-item__image-modal-image"
            />
            <button 
              className="message-item__image-modal-close"
              onClick={() => setShowImageModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;