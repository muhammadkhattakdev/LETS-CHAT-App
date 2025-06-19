import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  MicOff,
  Image,
  File,
  X,
  Plus
} from 'lucide-react';
import { useSocket } from '../../../../commonComponents/socketContext/socketContext';
import { useChat } from '../../../../commonComponents/chatContext/chatContext';
import EmojiPicker from 'emoji-picker-react';
import './style.css';

const MessageInput = ({ chatId, disabled = false }) => {
  const { sendMessage } = useChat();
  const { sendTyping } = useSocket();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      sendTyping(chatId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(chatId, false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, chatId, sendTyping, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        sendTyping(chatId, false);
      }
    };
  }, [chatId, sendTyping, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && attachments.length === 0) || disabled) {
      return;
    }

    const messageData = {
      content: message.trim(),
      attachments: attachments,
      messageType: attachments.length > 0 ? attachments[0].type : 'text',
    };

    try {
      await sendMessage(chatId, messageData);
      setMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowAttachmentMenu(false);
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        sendTyping(chatId, false);
      }
      
      // Focus back to textarea
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emojiObject) => {
    const emoji = emojiObject.emoji;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    setMessage(newMessage);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    setShowAttachmentMenu(false);
    
    // Clear input
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // TODO: Implement actual recording logic with MediaRecorder API
      console.log('Recording started', stream);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    // TODO: Implement actual recording stop and save logic
    console.log('Recording stopped');
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canSend = (message.trim() || attachments.length > 0) && !disabled;

  return (
    <div className="message-input">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="message-input__attachments">
          {attachments.map((attachment, index) => (
            <div key={index} className="message-input__attachment">
              {attachment.type === 'image' ? (
                <img 
                  src={attachment.url} 
                  alt={attachment.name}
                  className="message-input__attachment-image"
                />
              ) : (
                <div className="message-input__attachment-file">
                  <File size={24} />
                  <span className="message-input__attachment-name">
                    {attachment.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="message-input__attachment-remove"
                onClick={() => removeAttachment(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="message-input__recording">
          <div className="message-input__recording-indicator">
            <div className="message-input__recording-dot"></div>
            <span>Recording... {formatRecordingTime(recordingTime)}</span>
          </div>
          <button
            type="button"
            className="message-input__recording-stop"
            onClick={stopRecording}
          >
            <MicOff size={20} />
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="message-input__form">
        <div className="message-input__container">
          {/* Attachment Button */}
          <div className="message-input__attachment-menu">
            <button
              type="button"
              className="message-input__action-btn"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              disabled={disabled}
            >
              <Plus size={20} />
            </button>

            {showAttachmentMenu && (
              <div className="message-input__attachment-dropdown">
                <button
                  type="button"
                  className="message-input__attachment-option"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image size={20} />
                  <span>Photos</span>
                </button>
                <button
                  type="button"
                  className="message-input__attachment-option"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <File size={20} />
                  <span>Documents</span>
                </button>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="message-input__text-container">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write Something..."
              className="message-input__textarea"
              disabled={disabled}
              rows={1}
            />
          </div>

          {/* Action Buttons */}
          <div className="message-input__actions">
            {/* Emoji Button */}
            <div className="message-input__emoji-container">
              <button
                type="button"
                className="message-input__action-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
              >
                <Smile size={20} />
              </button>

              {showEmojiPicker && (
                <div className="message-input__emoji-picker">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    autoFocusSearch={false}
                    theme="light"
                    height={400}
                    width={350}
                  />
                </div>
              )}
            </div>

            {/* Voice Message Button */}
            <button
              type="button"
              className={`message-input__action-btn ${isRecording ? 'message-input__action-btn--recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              className={`message-input__send-btn ${canSend ? 'message-input__send-btn--active' : ''}`}
              disabled={!canSend}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </form>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MessageInput;