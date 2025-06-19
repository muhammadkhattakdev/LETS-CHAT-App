import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, MessageCircle, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../commonComponents/authContext/authContext';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import './style.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading, error, isAuthenticated, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    clearErrors,
  } = useForm();

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    clearError();
    clearErrors();

    const result = await registerUser({
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (result.success) {
      navigate('/chat');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left side - Branding */}
        <div className="signup-branding">
          <div className="signup-branding__content">
            <div className="signup-branding__icon">
              <MessageCircle size={48} />
            </div>
            <h1 className="signup-branding__title">Join Chat App Today</h1>
            <p className="signup-branding__subtitle">
              Create your account and start connecting with people around the world. Experience the future of communication.
            </p>
            <div className="signup-branding__stats">
              <div className="stat-item">
                <div className="stat-item__number">10k+</div>
                <div className="stat-item__label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-item__number">1M+</div>
                <div className="stat-item__label">Messages Sent</div>
              </div>
              <div className="stat-item">
                <div className="stat-item__number">99.9%</div>
                <div className="stat-item__label">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Signup form */}
        <div className="signup-form-section">
          <div className="signup-form-container">
            <div className="signup-form-header">
              <h2 className="signup-form-title">Create your account</h2>
              <p className="signup-form-subtitle">
                Join thousands of users already chatting on our platform.
              </p>
            </div>

            {error && (
              <div className="signup-error">
                <div className="signup-error__message">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <div className="form-input-container">
                    <User className="form-input-icon" size={20} />
                    <input
                      id="firstName"
                      type="text"
                      className={`form-input ${errors.firstName ? 'form-input--error' : ''}`}
                      placeholder="John"
                      autoComplete="given-name"
                      {...register('firstName', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'Must be at least 2 characters',
                        },
                        maxLength: {
                          value: 50,
                          message: 'Must be less than 50 characters',
                        },
                      })}
                    />
                  </div>
                  {errors.firstName && (
                    <span className="form-error">{errors.firstName.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <div className="form-input-container">
                    <User className="form-input-icon" size={20} />
                    <input
                      id="lastName"
                      type="text"
                      className={`form-input ${errors.lastName ? 'form-input--error' : ''}`}
                      placeholder="Doe"
                      autoComplete="family-name"
                      {...register('lastName', {
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Must be at least 2 characters',
                        },
                        maxLength: {
                          value: 50,
                          message: 'Must be less than 50 characters',
                        },
                      })}
                    />
                  </div>
                  {errors.lastName && (
                    <span className="form-error">{errors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <div className="form-input-container">
                  <User className="form-input-icon" size={20} />
                  <input
                    id="username"
                    type="text"
                    className={`form-input ${errors.username ? 'form-input--error' : ''}`}
                    placeholder="john_doe"
                    autoComplete="username"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Must be at least 3 characters',
                      },
                      maxLength: {
                        value: 20,
                        message: 'Must be less than 20 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Only letters, numbers, and underscores allowed',
                      },
                    })}
                  />
                </div>
                {errors.username && (
                  <span className="form-error">{errors.username.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="form-input-container">
                  <Mail className="form-input-icon" size={20} />
                  <input
                    id="email"
                    type="email"
                    className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                    placeholder="john@example.com"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <span className="form-error">{errors.email.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="form-input-container">
                  <Lock className="form-input-icon" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="form-input-action"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error">{errors.password.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="form-input-container">
                  <Lock className="form-input-icon" size={20} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => 
                        value === password || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    className="form-input-action"
                    onClick={toggleConfirmPasswordVisibility}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="form-error">{errors.confirmPassword.message}</span>
                )}
              </div>

              <div className="form-agreement">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    {...register('agreeToTerms', {
                      required: 'You must agree to the terms and conditions',
                    })}
                  />
                  <span className="checkbox-checkmark"></span>
                  <span className="checkbox-label">
                    I agree to the{' '}
                    <Link to="/terms" className="agreement-link">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="agreement-link">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <span className="form-error">{errors.agreeToTerms.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="signup-footer">
              <p className="signup-footer__text">
                Already have an account?{' '}
                <Link to="/login" className="signup-footer__link">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="signup-divider">
              <span className="signup-divider__text">Or sign up with</span>
            </div>

            <div className="social-signup">
              <button
                type="button"
                className="social-signup-button"
                onClick={() => {
                  // TODO: Implement Google OAuth
                  console.log('Google signup clicked');
                }}
              >
                <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              
              <button
                type="button"
                className="social-signup-button"
                onClick={() => {
                  // TODO: Implement GitHub OAuth
                  console.log('GitHub signup clicked');
                }}
              >
                <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;