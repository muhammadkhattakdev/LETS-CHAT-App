import React from 'react';
import LoadingSpinner from '../loadingSpinner/loadingSpinner';
import './style.css';

const PrimaryButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...rest
}) => {
  const buttonClasses = [
    'primary-button',
    `primary-button--${variant}`,
    `primary-button--${size}`,
    fullWidth && 'primary-button--full-width',
    loading && 'primary-button--loading',
    disabled && 'primary-button--disabled',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={loading || disabled}
      {...rest}
    >
      {loading ? (
        <div className="primary-button__loading">
          <LoadingSpinner 
            size={size === 'small' ? 'small' : 'medium'} 
            color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'} 
          />
          <span className="primary-button__loading-text">Loading...</span>
        </div>
      ) : (
        <div className="primary-button__content">
          {icon && iconPosition === 'left' && (
            <span className="primary-button__icon primary-button__icon--left">
              {icon}
            </span>
          )}
          {children && (
            <span className="primary-button__text">
              {children}
            </span>
          )}
          {icon && iconPosition === 'right' && (
            <span className="primary-button__icon primary-button__icon--right">
              {icon}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

export default PrimaryButton;