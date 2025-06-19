import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Lock, 
  Globe, 
  HelpCircle,
  Info,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../../commonComponents/authContext/authContext';
import PrimaryButton from '../../commonComponents/primaryButton/primaryButton';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import { useForm } from 'react-hook-form';
import './style.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, changePassword, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm();

  const settingsSections = [
    { id: 'account', label: 'Account', icon: <User size={20} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'data', label: 'Data & Storage', icon: <Globe size={20} /> },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle size={20} /> },
    { id: 'about', label: 'About', icon: <Info size={20} /> },
  ];

  const onPasswordSubmit = async (data) => {
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (result.success) {
        reset();
        setShowPasswordForm(false);
        // User will be logged out and redirected to login
      }
    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log('Delete account confirmed');
    setShowDeleteConfirm(false);
  };

  const renderAccountSection = () => (
    <div className="settings-section">
      <div className="settings-section__header">
        <h2>Account Settings</h2>
        <p>Manage your account information and security</p>
      </div>

      <div className="settings-cards">
        {/* Profile Information */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon">
              <User size={24} />
            </div>
            <div className="settings-card__title">
              <h3>Profile Information</h3>
              <p>Update your personal information</p>
            </div>
          </div>
          <div className="settings-card__content">
            <div className="settings-info-grid">
              <div className="settings-info-item">
                <label>Full Name</label>
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="settings-info-item">
                <label>Username</label>
                <span>@{user?.username}</span>
              </div>
              <div className="settings-info-item">
                <label>Email</label>
                <span>{user?.email}</span>
              </div>
              <div className="settings-info-item">
                <label>Bio</label>
                <span>{user?.bio || 'No bio added'}</span>
              </div>
            </div>
            <PrimaryButton
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Edit Profile
            </PrimaryButton>
          </div>
        </div>

        {/* Password & Security */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon">
              <Lock size={24} />
            </div>
            <div className="settings-card__title">
              <h3>Password & Security</h3>
              <p>Change your password and security settings</p>
            </div>
          </div>
          <div className="settings-card__content">
            {!showPasswordForm ? (
              <div className="settings-actions">
                <PrimaryButton
                  variant="outline"
                  onClick={() => setShowPasswordForm(true)}
                  icon={<Lock size={16} />}
                >
                  Change Password
                </PrimaryButton>
                <PrimaryButton
                  variant="outline"
                  onClick={handleLogout}
                  icon={<LogOut size={16} />}
                >
                  Logout All Devices
                </PrimaryButton>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    className={`form-input ${errors.currentPassword ? 'form-input--error' : ''}`}
                    {...register('currentPassword', {
                      required: 'Current password is required'
                    })}
                  />
                  {errors.currentPassword && (
                    <span className="form-error">{errors.currentPassword.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    className={`form-input ${errors.newPassword ? 'form-input--error' : ''}`}
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  {errors.newPassword && (
                    <span className="form-error">{errors.newPassword.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => 
                        value === watch('newPassword') || 'Passwords do not match'
                    })}
                  />
                  {errors.confirmPassword && (
                    <span className="form-error">{errors.confirmPassword.message}</span>
                  )}
                </div>

                <div className="form-actions">
                  <PrimaryButton
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      reset();
                    }}
                    disabled={isSubmitting || loading}
                  >
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton
                    type="submit"
                    variant="primary"
                    loading={isSubmitting || loading}
                    icon={<Save size={16} />}
                  >
                    Change Password
                  </PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-card settings-card--danger">
          <div className="settings-card__header">
            <div className="settings-card__icon">
              <Trash2 size={24} />
            </div>
            <div className="settings-card__title">
              <h3>Danger Zone</h3>
              <p>Irreversible and destructive actions</p>
            </div>
          </div>
          <div className="settings-card__content">
            <div className="danger-actions">
              <div className="danger-action">
                <div className="danger-action__info">
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all data</p>
                </div>
                <PrimaryButton
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={<Trash2 size={16} />}
                >
                  Delete Account
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="settings-section">
      <div className="settings-section__header">
        <h2>Privacy & Security</h2>
        <p>Control who can contact you and see your information</p>
      </div>

      <div className="settings-cards">
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon">
              <Eye size={24} />
            </div>
            <div className="settings-card__title">
              <h3>Visibility</h3>
              <p>Control who can see your information</p>
            </div>
          </div>
          <div className="settings-card__content">
            <div className="settings-options">
              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Profile Photo</label>
                  <p>Who can see your profile photo</p>
                </div>
                <select className="settings-select">
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Last Seen</label>
                  <p>Who can see when you were last online</p>
                </div>
                <select className="settings-select">
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Online Status</label>
                  <p>Show when you're online</p>
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle__slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-section">
      <div className="settings-section__header">
        <h2>Notifications</h2>
        <p>Manage how you receive notifications</p>
      </div>

      <div className="settings-cards">
        <div className="settings-card">
          <div className="settings-card__content">
            <div className="settings-options">
              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Message Notifications</label>
                  <p>Get notified when you receive new messages</p>
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle__slider"></span>
                </label>
              </div>

              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Sound Notifications</label>
                  <p>Play sound for new messages</p>
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle__slider"></span>
                </label>
              </div>

              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Desktop Notifications</label>
                  <p>Show notifications on your desktop</p>
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle__slider"></span>
                </label>
              </div>

              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Group Notifications</label>
                  <p>Get notified for group messages</p>
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle__slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="settings-section">
      <div className="settings-section__header">
        <h2>Appearance</h2>
        <p>Customize the look and feel of the app</p>
      </div>

      <div className="settings-cards">
        <div className="settings-card">
          <div className="settings-card__content">
            <div className="settings-options">
              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Theme</label>
                  <p>Choose your preferred theme</p>
                </div>
                <select className="settings-select">
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Font Size</label>
                  <p>Adjust the text size</p>
                </div>
                <select className="settings-select">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="settings-option">
                <div className="settings-option__info">
                  <label>Compact Mode</label>
                  <p>Use a more compact layout</p>
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" />
                  <span className="settings-toggle__slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'account': return renderAccountSection();
      case 'privacy': return renderPrivacySection();
      case 'notifications': return renderNotificationsSection();
      case 'appearance': return renderAppearanceSection();
      case 'data': return (
        <div className="settings-section">
          <div className="settings-section__header">
            <h2>Data & Storage</h2>
            <p>Manage your data and storage preferences</p>
          </div>
          <div className="settings-placeholder">
            <p>Data & Storage settings coming soon...</p>
          </div>
        </div>
      );
      case 'help': return (
        <div className="settings-section">
          <div className="settings-section__header">
            <h2>Help & Support</h2>
            <p>Get help and contact support</p>
          </div>
          <div className="settings-placeholder">
            <p>Help & Support section coming soon...</p>
          </div>
        </div>
      );
      case 'about': return (
        <div className="settings-section">
          <div className="settings-section__header">
            <h2>About</h2>
            <p>Information about the application</p>
          </div>
          <div className="settings-cards">
            <div className="settings-card">
              <div className="settings-card__content">
                <div className="about-info">
                  <h3>Chat App</h3>
                  <p>Version 1.0.0</p>
                  <p>A modern real-time chat application</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header__nav">
          <button 
            className="settings-header__back"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="settings-header__title">
            <h1>Settings</h1>
            <p>Manage your account and app preferences</p>
          </div>
        </div>
      </div>

      <div className="settings-container">
        {/* Sidebar */}
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                className={`settings-nav__item ${
                  activeSection === section.id ? 'settings-nav__item--active' : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="settings-nav__icon">{section.icon}</div>
                <span className="settings-nav__label">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="settings-content">
          {renderSection()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>Delete Account</h3>
              <button 
                className="modal__close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__content">
              <p>
                Are you sure you want to delete your account? This action cannot be undone.
                All your data, messages, and chats will be permanently deleted.
              </p>
            </div>
            <div className="modal__actions">
              <PrimaryButton
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                variant="danger"
                onClick={handleDeleteAccount}
                icon={<Trash2 size={16} />}
              >
                Delete Account
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;