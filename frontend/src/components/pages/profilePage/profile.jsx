import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  MessageCircle, 
  MoreVertical,
  Calendar,
  Mail,
  AtSign,
  MapPin,
  Phone,
  Globe,
  UserPlus,
  UserMinus,
  Flag,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../commonComponents/authContext/authContext';
import { useChat } from '../../commonComponents/chatContext/chatContext';
import { useSocket } from '../../commonComponents/socketContext/socketContext';
import PrimaryButton from '../../commonComponents/primaryButton/primaryButton';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import ProfileModal from '../../commonComponents/sidebar/sidebarComponents/profileModal/profileModal';
import { format } from 'date-fns';
import request from '../../../utils/request';
import './style.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { createPrivateChat } = useChat();
  const { isUserOnline } = useSocket();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const isOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id;

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!targetUserId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (isOwnProfile) {
          setProfileUser(currentUser);
        } else {
          const result = await request.user.getUserProfile(targetUserId);
          if (result.success) {
            setProfileUser(result.data.data.user);
          } else {
            setError(result.error || 'Failed to load profile');
          }
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId, isOwnProfile, currentUser]);

  const handleStartChat = async () => {
    if (isOwnProfile || !profileUser) return;
    
    try {
      const chat = await createPrivateChat(profileUser.id);
      if (chat) {
        navigate(`/chat/${chat.id}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleAddFriend = async () => {
    // TODO: Implement add friend functionality
    console.log('Add friend:', profileUser.id);
  };

  const handleBlockUser = async () => {
    // TODO: Implement block user functionality
    console.log('Block user:', profileUser.id);
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Unknown';
    return format(new Date(date), 'MMMM yyyy');
  };

  if (loading) {
    return (
      <div className="profile-page profile-page--loading">
        <LoadingSpinner size="large" message="Loading profile..." />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profile-page profile-page--error">
        <div className="profile-error">
          <div className="profile-error__icon">👤</div>
          <h2 className="profile-error__title">Profile not found</h2>
          <p className="profile-error__message">
            {error || 'The user profile you are looking for does not exist.'}
          </p>
          <PrimaryButton
            variant="primary"
            onClick={() => navigate('/chat')}
            icon={<ArrowLeft size={20} />}
          >
            Back to Chat
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const isOnline = isUserOnline(profileUser.id);

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header__nav">
          <button 
            className="profile-header__back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="profile-header__title">
            <h1>Profile</h1>
            <p>{isOwnProfile ? 'Your profile' : `${profileUser.firstName}'s profile`}</p>
          </div>
        </div>

        {!isOwnProfile && (
          <div className="profile-header__actions">
            <div className="profile-header__menu">
              <button 
                className="profile-header__menu-btn"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
              >
                <MoreVertical size={20} />
              </button>
              
              {showMoreMenu && (
                <div className="profile-header__dropdown">
                  <button className="profile-header__dropdown-item">
                    <UserPlus size={16} />
                    <span>Add Friend</span>
                  </button>
                  <button className="profile-header__dropdown-item">
                    <Flag size={16} />
                    <span>Report User</span>
                  </button>
                  <div className="profile-header__dropdown-divider" />
                  <button className="profile-header__dropdown-item profile-header__dropdown-item--danger">
                    <Block size={16} />
                    <span>Block User</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* Avatar and Basic Info */}
        <div className="profile-hero">
          <div className="profile-hero__avatar">
            {profileUser.avatar ? (
              <img 
                src={profileUser.avatar} 
                alt={`${profileUser.firstName} ${profileUser.lastName}`}
                className="profile-hero__avatar-image"
              />
            ) : (
              <div className="profile-hero__avatar-fallback">
                {profileUser.firstName?.[0]}{profileUser.lastName?.[0]}
              </div>
            )}
            <div className={`profile-hero__status ${isOnline ? 'online' : 'offline'}`} />
          </div>

          <div className="profile-hero__info">
            <h2 className="profile-hero__name">
              {profileUser.firstName} {profileUser.lastName}
            </h2>
            <p className="profile-hero__username">@{profileUser.username}</p>
            <p className="profile-hero__status-text">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="profile-hero__actions">
            {isOwnProfile ? (
              <PrimaryButton
                variant="primary"
                onClick={() => setShowEditModal(true)}
                icon={<Edit size={20} />}
              >
                Edit Profile
              </PrimaryButton>
            ) : (
              <>
                <PrimaryButton
                  variant="primary"
                  onClick={handleStartChat}
                  icon={<MessageCircle size={20} />}
                >
                  Message
                </PrimaryButton>
                <PrimaryButton
                  variant="outline"
                  onClick={handleAddFriend}
                  icon={<UserPlus size={20} />}
                >
                  Add Friend
                </PrimaryButton>
              </>
            )}
            
            {isOwnProfile && (
              <PrimaryButton
                variant="outline"
                onClick={() => navigate('/settings')}
                icon={<SettingsIcon size={20} />}
              >
                Settings
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profileUser.bio && (
          <div className="profile-section">
            <h3 className="profile-section__title">About</h3>
            <div className="profile-section__content">
              <p className="profile-bio">{profileUser.bio}</p>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="profile-section">
          <h3 className="profile-section__title">Contact Information</h3>
          <div className="profile-section__content">
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <div className="profile-info-item__icon">
                  <Mail size={20} />
                </div>
                <div className="profile-info-item__content">
                  <label>Email</label>
                  <span>{isOwnProfile ? profileUser.email : 'Hidden'}</span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-item__icon">
                  <AtSign size={20} />
                </div>
                <div className="profile-info-item__content">
                  <label>Username</label>
                  <span>@{profileUser.username}</span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-item__icon">
                  <Calendar size={20} />
                </div>
                <div className="profile-info-item__content">
                  <label>Joined</label>
                  <span>{formatJoinDate(profileUser.createdAt)}</span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-item__icon">
                  <Globe size={20} />
                </div>
                <div className="profile-info-item__content">
                  <label>Status</label>
                  <span className={`profile-status ${isOnline ? 'online' : 'offline'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="profile-section">
          <h3 className="profile-section__title">Activity</h3>
          <div className="profile-section__content">
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat__number">0</div>
                <div className="profile-stat__label">Friends</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat__number">0</div>
                <div className="profile-stat__label">Groups</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat__number">0</div>
                <div className="profile-stat__label">Messages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="profile-section">
          <h3 className="profile-section__title">Recent Activity</h3>
          <div className="profile-section__content">
            <div className="profile-activity">
              <div className="profile-activity__empty">
                <div className="profile-activity__empty-icon">📱</div>
                <p>No recent activity to show</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && isOwnProfile && (
        <ProfileModal
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default Profile;