import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useInView } from 'react-intersection-observer';
import MessageItem from './messageListComponents/messageItem/messageItem';
import DateDivider from './messageListComponents/dateDivider/dateDivider';
import LoadingSpinner from '../../../../commonComponents/loadingSpinner/loadingSpinner';
import { useChat } from '../../../../commonComponents/chatContext/chatContext';
import './style.css';

const MessageList = ({ messages = [], currentUserId, chat }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { loadMessages } = useChat();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);

  // Intersection observer for infinite scrolling
  const { ref: topSentinelRef, inView: topInView } = useInView({
    threshold: 0,
    rootMargin: '100px 0px 0px 0px',
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    if (topInView && hasMoreMessages && !isLoadingMore && messages.length > 0) {
      loadMoreMessages();
    }
  }, [topInView, hasMoreMessages, isLoadingMore, messages.length]);

  const loadMoreMessages = async () => {
    if (!chat?.id || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const olderMessages = await loadMessages(chat.id, nextPage);
      
      if (!olderMessages || olderMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt);
      const prevMessage = messages[index - 1];
      const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;

      // Check if we need a new date group
      if (!prevDate || !isSameDay(messageDate, prevDate)) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          date: messageDate,
          messages: [message]
        };
      } else {
        currentGroup.messages.push(message);
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Format date for divider
  const formatDateDivider = (date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  // Check if messages should be grouped together
  const shouldGroupWithPrevious = (currentMessage, previousMessage) => {
    if (!previousMessage) return false;
    
    // Same sender
    if (currentMessage.sender.id !== previousMessage.sender.id) return false;
    
    // Within 5 minutes
    const timeDiff = new Date(currentMessage.createdAt) - new Date(previousMessage.createdAt);
    return timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <div className="message-list__empty-state">
          <div className="message-list__empty-icon">💬</div>
          <h3 className="message-list__empty-title">No messages yet</h3>
          <p className="message-list__empty-description">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" ref={messagesContainerRef}>
      {/* Top loading indicator */}
      {hasMoreMessages && (
        <div ref={topSentinelRef} className="message-list__load-trigger">
          {isLoadingMore && (
            <div className="message-list__loading">
              <LoadingSpinner size="small" />
              <span>Loading more messages...</span>
            </div>
          )}
        </div>
      )}

      {/* Messages grouped by date */}
      <div className="message-list__content">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date.toISOString()} className="message-list__date-group">
            <DateDivider date={formatDateDivider(group.date)} />
            
            <div className="message-list__messages">
              {group.messages.map((message, messageIndex) => {
                const previousMessage = messageIndex > 0 
                  ? group.messages[messageIndex - 1] 
                  : groupIndex > 0 
                    ? groupedMessages[groupIndex - 1].messages.slice(-1)[0] 
                    : null;

                const nextMessage = messageIndex < group.messages.length - 1
                  ? group.messages[messageIndex + 1]
                  : groupIndex < groupedMessages.length - 1
                    ? groupedMessages[groupIndex + 1].messages[0]
                    : null;

                const isGroupedWithPrevious = shouldGroupWithPrevious(message, previousMessage);
                const isGroupedWithNext = shouldGroupWithPrevious(nextMessage, message);

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isOwn={message.sender.id === currentUserId}
                    isGroupedWithPrevious={isGroupedWithPrevious}
                    isGroupedWithNext={isGroupedWithNext}
                    showSenderName={chat.chatType === 'group' && !isGroupedWithPrevious}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll to bottom anchor */}
      <div ref={messagesEndRef} className="message-list__bottom-anchor" />
    </div>
  );
};

export default MessageList;