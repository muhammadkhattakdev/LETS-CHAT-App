import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, MessageCircle, Search } from 'lucide-react';
import PrimaryButton from '../../commonComponents/primaryButton/primaryButton';
import './style.css';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/chat');
    }
  };

  const handleGoHome = () => {
    navigate('/chat');
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        {/* Animated 404 */}
        <div className="not-found-animation">
          <div className="not-found-number">4</div>
          <div className="not-found-icon">
            <MessageCircle size={120} />
          </div>
          <div className="not-found-number">4</div>
        </div>

        {/* Content */}
        <div className="not-found-content">
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-description">
            Oops! The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="not-found-actions">
            <PrimaryButton
              variant="primary"
              size="large"
              icon={<Home size={20} />}
              onClick={handleGoHome}
            >
              Go to Chat
            </PrimaryButton>
            
            <PrimaryButton
              variant="outline"
              size="large"
              icon={<ArrowLeft size={20} />}
              onClick={handleGoBack}
            >
              Go Back
            </PrimaryButton>
          </div>

          {/* Help Section */}
          <div className="not-found-help">
            <h3 className="not-found-help-title">What you can do:</h3>
            <div className="not-found-help-list">
              <div className="help-item">
                <div className="help-item-icon">
                  <Home size={20} />
                </div>
                <div className="help-item-content">
                  <h4>Return to Dashboard</h4>
                  <p>Go back to your main chat interface</p>
                </div>
              </div>
              
              <div className="help-item">
                <div className="help-item-icon">
                  <Search size={20} />
                </div>
                <div className="help-item-content">
                  <h4>Search for Chats</h4>
                  <p>Use the search feature to find conversations</p>
                </div>
              </div>
              
              <div className="help-item">
                <div className="help-item-icon">
                  <MessageCircle size={20} />
                </div>
                <div className="help-item-content">
                  <h4>Start New Chat</h4>
                  <p>Create a new conversation with friends</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="not-found-decorations">
          <div className="decoration decoration-1"></div>
          <div className="decoration decoration-2"></div>
          <div className="decoration decoration-3"></div>
          <div className="decoration decoration-4"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;