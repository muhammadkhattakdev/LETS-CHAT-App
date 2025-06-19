import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, MessageCircle, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../commonComponents/authContext/authContext';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import './style.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm();

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

    const result = await login({
      identifier: data.identifier,
      password: data.password,
    });

    if (result.success) {
      navigate('/chat');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="login-branding__content">
            <div className="login-branding__icon">
              <MessageCircle size={48} />
            </div>
            <h1 className="login-branding__title">Welcome to Chat App</h1>
            <p className="login-branding__subtitle">
              Connect with friends and colleagues in real-time. Experience seamless communication with modern features.
            </p>
            <div className="login-branding__features">
              <div className="feature-item">
                <div className="feature-item__icon">✨</div>
                <span>Real-time messaging</span>
              </div>
              <div className="feature-item">
                <div className="feature-item__icon">🔒</div>
                <span>Secure & private</span>
              </div>
              <div className="feature-item">
                <div className="feature-item__icon">📱</div>
                <span>Cross-platform support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="login-form-section">
          <div className="login-form-container">
            <div className="login-form-header">
              <h2 className="login-form-title">Sign in to your account</h2>
              <p className="login-form-subtitle">
                Welcome back! Please enter your details.
              </p>
            </div>

            {error && (
              <div className="login-error">
                <div className="login-error__message">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">
                  Email or Username
                </label>
                <div className="form-input-container">
                  <Mail className="form-input-icon" size={20} />
                  <input
                    id="identifier"
                    type="text"
                    className={`form-input ${errors.identifier ? 'form-input--error' : ''}`}
                    placeholder="Enter your email or username"
                    autoComplete="username"
                    {...register('identifier', {
                      required: 'Email or username is required',
                      minLength: {
                        value: 3,
                        message: 'Must be at least 3 characters',
                      },
                    })}
                  />
                </div>
                {errors.identifier && (
                  <span className="form-error">{errors.identifier.message}</span>
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
                    autoComplete="current-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
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

              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    {...register('rememberMe')}
                  />
                  <span className="checkbox-checkmark"></span>
                  <span className="checkbox-label">Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p className="login-footer__text">
                Don't have an account?{' '}
                <Link to="/signup" className="login-footer__link">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="login-divider">
              <span className="login-divider__text">Or continue with</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-login-button"
                onClick={() => {
                  // TODO: Implement Google OAuth
                  console.log('Google login clicked');
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
                className="social-login-button"
                onClick={() => {
                  // TODO: Implement GitHub OAuth
                  console.log('GitHub login clicked');
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

export default Login;