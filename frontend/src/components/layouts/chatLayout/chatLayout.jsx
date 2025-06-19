import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../commonComponents/sidebar/sidebar';
import { useAuth } from '../../commonComponents/authContext/authContext';
import { useSocket } from '../../commonComponents/socketContext/socketContext';
import { useChat } from '../../commonComponents/chatContext/chatContext';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import './style.css';

const ChatLayout = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { loadChats, loading } = useChat();

  // Load chats when component mounts
  useEffect(() => {
    if (user && !loading) {
      loadChats();
    }
  }, [user, loadChats, loading]);

  // Show loading spinner while initial data is loading
  if (loading && !user) {
    return (
      <div className="chat-layout-loading">
        <LoadingSpinner size="large" message="Loading your chats..." />
      </div>
    );
  }

  return (
    <div className="chat-layout">
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="connection-status">
          <div className="connection-status__indicator">
            <div className="connection-status__icon">
              <div className="connection-status__dot"></div>
            </div>
            <span className="connection-status__text">
              Reconnecting...
            </span>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="chat-layout__container">
        {/* Sidebar */}
        <aside className="chat-layout__sidebar">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <main className="chat-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ChatLayout;