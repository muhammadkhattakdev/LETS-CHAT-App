import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Edit,
  Save,
  User,
  Mail,
  AtSign,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../../authContext/authContext";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../../../loadingSpinner/loadingSpinner";
import PrimaryButton from "../../../primaryButton/primaryButton";
import { format } from "date-fns";
import "./style.css";

const ProfileModal = ({ onClose }) => {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
    },
  });

  useEffect(() => {
    // Close modal on Escape key
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
    });
  };

  const handleCancel = () => {
    if (isEditing) {
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      reset();
    } else {
      onClose();
    }
  };

  const onSubmit = async (data) => {
    try {
      const updateData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        bio: data.bio.trim(),
      };

      // TODO: Handle avatar upload
      if (avatarFile) {
        // Implementation for avatar upload would go here
        console.log("Avatar file to upload:", avatarFile);
      }

      const result = await updateProfile(updateData);

      if (result.success) {
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const formatJoinDate = (date) => {
    if (!date) return "Unknown";
    return format(new Date(date), "MMMM yyyy");
  };

  const watchedValues = watch();
  const hasChanges =
    watchedValues.firstName !== user?.firstName ||
    watchedValues.lastName !== user?.lastName ||
    watchedValues.bio !== user?.bio ||
    avatarFile !== null;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal" ref={modalRef}>
        {/* Header */}
        <div className="profile-modal__header">
          <div className="profile-modal__title-section">
            <h2 className="profile-modal__title">
              {isEditing ? "Edit Profile" : "Profile"}
            </h2>
            <p className="profile-modal__subtitle">
              {isEditing
                ? "Update your profile information"
                : "View your profile details"}
            </p>
          </div>
          <button
            className="profile-modal__close"
            onClick={handleCancel}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="profile-modal__content">
          {/* Avatar Section */}
          <div className="profile-modal__avatar-section">
            <div className="profile-modal__avatar">
              {avatarPreview || user?.avatar ? (
                <img
                  src={avatarPreview || user.avatar}
                  alt="Profile"
                  className="profile-modal__avatar-image"
                />
              ) : (
                <div className="profile-modal__avatar-fallback">
                  <User size={48} />
                </div>
              )}

              {isEditing && (
                <button
                  type="button"
                  className="profile-modal__avatar-edit"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={20} />
                </button>
              )}
            </div>

            {isEditing && (
              <p className="profile-modal__avatar-hint">
                Click the camera icon to change your profile picture
              </p>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="profile-modal__form"
          >
            {/* Basic Information */}
            <div className="profile-modal__section">
              <h3 className="profile-modal__section-title">
                <User size={20} />
                Basic Information
              </h3>

              <div className="profile-modal__form-grid">
                <div className="profile-modal__form-group">
                  <label className="profile-modal__label">First Name</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        className={`profile-modal__input ${
                          errors.firstName ? "profile-modal__input--error" : ""
                        }`}
                        {...register("firstName", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "Must be at least 2 characters",
                          },
                          maxLength: {
                            value: 50,
                            message: "Must be less than 50 characters",
                          },
                        })}
                      />
                      {errors.firstName && (
                        <span className="profile-modal__error">
                          {errors.firstName.message}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="profile-modal__value">{user?.firstName}</p>
                  )}
                </div>

                <div className="profile-modal__form-group">
                  <label className="profile-modal__label">Last Name</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        className={`profile-modal__input ${
                          errors.lastName ? "profile-modal__input--error" : ""
                        }`}
                        {...register("lastName", {
                          required: "Last name is required",
                          minLength: {
                            value: 2,
                            message: "Must be at least 2 characters",
                          },
                          maxLength: {
                            value: 50,
                            message: "Must be less than 50 characters",
                          },
                        })}
                      />
                      {errors.lastName && (
                        <span className="profile-modal__error">
                          {errors.lastName.message}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="profile-modal__value">{user?.lastName}</p>
                  )}
                </div>
              </div>

              <div className="profile-modal__form-group">
                <label className="profile-modal__label">Bio</label>
                {isEditing ? (
                  <div>
                    <textarea
                      className={`profile-modal__textarea ${
                        errors.bio ? "profile-modal__textarea--error" : ""
                      }`}
                      rows={3}
                      placeholder="Tell people a bit about yourself..."
                      {...register("bio", {
                        maxLength: {
                          value: 500,
                          message: "Bio must be less than 500 characters",
                        },
                      })}
                    />
                    {errors.bio && (
                      <span className="profile-modal__error">
                        {errors.bio.message}
                      </span>
                    )}
                    <div className="profile-modal__char-count">
                      {watchedValues.bio?.length || 0}/500
                    </div>
                  </div>
                ) : (
                  <p className="profile-modal__value">
                    {user?.bio || "No bio added yet"}
                  </p>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="profile-modal__section">
              <h3 className="profile-modal__section-title">
                <AtSign size={20} />
                Account Information
              </h3>

              <div className="profile-modal__info-grid">
                <div className="profile-modal__info-item">
                  <div className="profile-modal__info-icon">
                    <Mail size={16} />
                  </div>
                  <div className="profile-modal__info-content">
                    <label className="profile-modal__info-label">Email</label>
                    <p className="profile-modal__info-value">{user?.email}</p>
                  </div>
                </div>

                <div className="profile-modal__info-item">
                  <div className="profile-modal__info-icon">
                    <AtSign size={16} />
                  </div>
                  <div className="profile-modal__info-content">
                    <label className="profile-modal__info-label">
                      Username
                    </label>
                    <p className="profile-modal__info-value">
                      @{user?.username}
                    </p>
                  </div>
                </div>

                <div className="profile-modal__info-item">
                  <div className="profile-modal__info-icon">
                    <Calendar size={16} />
                  </div>
                  <div className="profile-modal__info-content">
                    <label className="profile-modal__info-label">Joined</label>
                    <p className="profile-modal__info-value">
                      {formatJoinDate(user?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="profile-modal__info-item">
                  <div className="profile-modal__info-icon">
                    <MessageSquare size={16} />
                  </div>
                  <div className="profile-modal__info-content">
                    <label className="profile-modal__info-label">Status</label>
                    <p className="profile-modal__info-value">
                      <span className="profile-modal__status online">
                        Online
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="profile-modal__footer">
          {isEditing ? (
            <div className="profile-modal__actions">
              <PrimaryButton
                variant="outline"
                onClick={handleCancel}
                disabled={loading || isSubmitting}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                type="submit"
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                disabled={!hasChanges || loading || isSubmitting}
                loading={loading || isSubmitting}
                icon={<Save size={20} />}
              >
                Save Changes
              </PrimaryButton>
            </div>
          ) : (
            <div className="profile-modal__actions">
              <PrimaryButton
                variant="primary"
                onClick={handleEdit}
                icon={<Edit size={20} />}
              >
                Edit Profile
              </PrimaryButton>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default ProfileModal;
