import React from 'react';
import { MessageCircle, Users, Zap, Shield, Globe, Smartphone } from 'lucide-react';
import { useAuth } from '../../../../commonComponents/authContext/authContext';
import PrimaryButton from '../../../../commonComponents/primaryButton/primaryButton';
import './style.css';

const WelcomeScreen = () => {
  const { user, userDisplayName } = useAuth();

  const features = [
    {
      icon: <Zap size={24} />,
      title: 'Lightning Fast',
      description: 'Real-time messaging with instant delivery and read receipts'
    },
    {
      icon: <Shield size={24} />,
      title: 'Secure & Private',
      description: 'End-to-end encryption keeps your conversations safe'
    },
    {
      icon: <Globe size={24} />,
      title: 'Cross Platform',
      description: 'Available on web, mobile, and desktop applications'
    },
    {
      icon: <Users size={24} />,
      title: 'Group Chats',
      description: 'Create groups with unlimited members and rich features'
    },
    {
      icon: <Smartphone size={24} />,
      title: 'Media Sharing',
      description: 'Share photos, videos, documents, and voice messages'
    },
    {
      icon: <MessageCircle size={24} />,
      title: 'Rich Messaging',
      description: 'Send emojis, GIFs, stickers, and formatted text'
    }
  ];

  return (
    <div className="welcome-screen">
      <div className="welcome-screen__container">
        {/* Hero Section */}
        <div className="welcome-screen__hero">
          <div className="welcome-screen__logo">
            <MessageCircle size={64} />
          </div>
          
          <h1 className="welcome-screen__title">
            Welcome to Chat App{user && `, ${userDisplayName.split(' ')[0]}`}!
          </h1>
          
          <p className="welcome-screen__subtitle">
            Connect with friends, family, and colleagues around the world. 
            Start a conversation by selecting a chat from the sidebar or creating a new one.
          </p>

          <div className="welcome-screen__stats">
            <div className="stat-card">
              <div className="stat-card__number">10K+</div>
              <div className="stat-card__label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__number">1M+</div>
              <div className="stat-card__label">Messages Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__number">99.9%</div>
              <div className="stat-card__label">Uptime</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="welcome-screen__features">
          <h2 className="welcome-screen__features-title">
            Why choose Chat App?
          </h2>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-card__icon">
                  {feature.icon}
                </div>
                <h3 className="feature-card__title">
                  {feature.title}
                </h3>
                <p className="feature-card__description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="welcome-screen__cta">
          <h2 className="welcome-screen__cta-title">
            Ready to start chatting?
          </h2>
          <p className="welcome-screen__cta-description">
            Select an existing conversation from the sidebar or start a new chat by searching for users.
          </p>
          
          <div className="welcome-screen__cta-buttons">
            <PrimaryButton
              variant="primary"
              size="large"
              icon={<Users size={20} />}
              onClick={() => {
                // Focus search input in sidebar
                const searchInput = document.querySelector('.sidebar__search-input');
                if (searchInput) {
                  searchInput.focus();
                }
              }}
            >
              Find People
            </PrimaryButton>
            
            <PrimaryButton
              variant="outline"
              size="large"
              icon={<MessageCircle size={20} />}
              onClick={() => {
                // This could open a group creation modal
                console.log('Create group clicked');
              }}
            >
              Create Group
            </PrimaryButton>
          </div>
        </div>

        {/* Tips Section */}
        <div className="welcome-screen__tips">
          <h3 className="welcome-screen__tips-title">
            💡 Quick Tips
          </h3>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-item__icon">🔍</span>
              <span className="tip-item__text">
                Use the search bar to find friends and start conversations
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-item__icon">📱</span>
              <span className="tip-item__text">
                Press Ctrl/Cmd + K for quick navigation and shortcuts
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-item__icon">🎨</span>
              <span className="tip-item__text">
                Customize your profile and status in the settings menu
              </span>
            </div>
            <div className="tip-item">
              <span className="tip-item__icon">🔔</span>
              <span className="tip-item__text">
                Enable notifications to never miss important messages
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;