import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MessageCircle, ArrowLeft, Search } from 'lucide-react';
import PrimaryButton from '../../commonComponents/primaryButton/primaryButton';
import { useAuth } from '../../commonComponents/authContext/authContext';
import './style.css';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="notfound-page">
      <div className="notfound-container">
        {/* Animated 404 */}
        <div className="notfound-animation">
          <div className="notfound-number">
            <span className="notfound-digit">4</span>
            <div className="notfound-emoji">
              <MessageCircle size={120} />
            </div>
            <span className="notfound-digit">4</span>
          </div>
        </div>

        {/* Content */}
        <div className="notfound-content">
          <h1 className="notfound-title">Oops! Page not found</h1>
          <p className="notfound-description">
            The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>

          {/* Error Details */}
          <div className="notfound-details">
            <div className="notfound-detail">
              <span className="notfound-detail__label">Error Code:</span>
              <span className="notfound-detail__value">404</span>
            </div>
            <div className="notfound-detail">
              <span className="notfound-detail__label">Requested URL:</span>
              <span className="notfound-detail__value">{window.location.pathname}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="notfound-actions">
            <PrimaryButton
              variant="primary"
              size="large"
              onClick={handleGoHome}
              icon={isAuthenticated ? <MessageCircle size={20} /> : <Home size={20} />}
            >
              {isAuthenticated ? 'Go to Chat' : 'Go to Home'}
            </PrimaryButton>

            <PrimaryButton
              variant="outline"
              size="large"
              onClick={handleGoBack}
              icon={<ArrowLeft size={20} />}
            >
              Go Back
            </PrimaryButton>
          </div>

          {/* Helpful Links */}
          <div className="notfound-links">
            <h3 className="notfound-links__title">Popular pages:</h3>
            <div className="notfound-links__list">
              {isAuthenticated ? (
                <>
                  <button 
                    className="notfound-link"
                    onClick={() => navigate('/chat')}
                  >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                  </button>
                  <button 
                    className="notfound-link"
                    onClick={() => navigate('/profile')}
                  >
                    <div className="notfound-link__icon">👤</div>
                    <span>Profile</span>
                  </button>
                  <button 
                    className="notfound-link"
                    onClick={() => navigate('/settings')}
                  >
                    <div className="notfound-link__icon">⚙️</div>
                    <span>Settings</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="notfound-link"
                    onClick={() => navigate('/login')}
                  >
                    <div className="notfound-link__icon">🔑</div>
                    <span>Login</span>
                  </button>
                  <button 
                    className="notfound-link"
                    onClick={() => navigate('/signup')}
                  >
                    <div className="notfound-link__icon">✨</div>
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Suggestion */}
          <div className="notfound-search">
            <div className="notfound-search__icon">
              <Search size={24} />
            </div>
            <div className="notfound-search__content">
              <h4>Looking for something specific?</h4>
              <p>Try checking the URL for typos or navigate using the menu.</p>
            </div>
          </div>
        </div>

        {/* Fun Facts */}
        <div className="notfound-facts">
          <h3 className="notfound-facts__title">Did you know?</h3>
          <div className="notfound-fact">
            <div className="notfound-fact__emoji">🌐</div>
            <p>404 errors are named after room 404 at CERN where the original web server was located.</p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="notfound-decorations">
          <div className="floating-icon floating-icon--1">💬</div>
          <div className="floating-icon floating-icon--2">📱</div>
          <div className="floating-icon floating-icon--3">🔍</div>
          <div className="floating-icon floating-icon--4">⚡</div>
          <div className="floating-icon floating-icon--5">🚀</div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;