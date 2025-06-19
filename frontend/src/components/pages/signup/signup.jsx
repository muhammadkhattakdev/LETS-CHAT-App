import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Eye, 
  EyeOff, 
  MessageCircle, 
  Mail, 
  Lock, 
  User, 
  AtSign,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../commonComponents/authContext/authContext';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import './style.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register: authRegister, loading, error, isAuthenticated, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    watch,
    trigger
  } = useForm();

  const watchedPassword = watch('password');

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
    if (step === 1) {
      // Validate first step and move to next
      const isValid = await trigger(['firstName', 'lastName', 'username']);
      if (isValid) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      // Validate second step and move to next
      const isValid = await trigger(['email', 'password', 'confirmPassword']);
      if (isValid) {
        setStep(3);
      }
      return;
    }

    if (step === 3) {
      if (!acceptedTerms) {
        return;
      }

      clearError();
      clearErrors();

      const result = await authRegister({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        navigate('/chat');
      }
    }
  };

  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;

    if (strength <= 2) return { strength, label: 'Weak', color: '#ef4444' };
    if (strength <= 3) return { strength, label: 'Fair', color: '#f59e0b' };
    if (strength <= 4) return { strength, label: 'Good', color: '#10b981' };
    return { strength, label: 'Strong', color: '#059669' };
  };

  const passwordStrength = getPasswordStrength(watchedPassword);

  const renderStep1 = () => (
    <div className="signup-step">
      <div className="signup-step__header">
        <h2>Tell us about yourself</h2>
        <p>Let's start with your basic information</p>
      </div>

      <div className="signup-form__content">
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
                placeholder="Enter your first name"
                autoComplete="given-name"
                {...formRegister('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: 'First name can only contain letters',
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
                placeholder="Enter your last name"
                autoComplete="family-name"
                {...formRegister('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: 'Last name can only contain letters',
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
            <AtSign className="form-input-icon" size={20} />
            <input
              id="username"
              type="text"
              className={`form-input ${errors.username ? 'form-input--error' : ''}`}
              placeholder="Choose a unique username"
              autoComplete="username"
              {...formRegister('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Username can only contain letters, numbers, and underscores',
                },
              })}
            />
          </div>
          {errors.username && (
            <span className="form-error">{errors.username.message}</span>
          )}
          <span className="form-hint">
            Username can only contain letters, numbers, and underscores
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="signup-step">
      <div className="signup-step__header">
        <h2>Account credentials</h2>
        <p>Set up your email and password</p>
      </div>

      <div className="signup-form__content">
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
              placeholder="Enter your email address"
              autoComplete="email"
              {...formRegister('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
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
              placeholder="Create a strong password"
              autoComplete="new-password"
              {...formRegister('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
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
          
          {/* Password Strength Indicator */}
          {watchedPassword && (
            <div className="password-strength">
              <div className="password-strength__bar">
                <div 
                  className="password-strength__fill"
                  style={{ 
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    backgroundColor: passwordStrength.color 
                  }}
                ></div>
              </div>
              <span 
                className="password-strength__label"
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.label}
              </span>
            </div>
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
              {...formRegister('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => 
                  value === watchedPassword || 'Passwords do not match',
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
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="signup-step">
      <div className="signup-step__header">
        <h2>Terms and Privacy</h2>
        <p>Review and accept our terms to continue</p>
      </div>

      <div className="signup-form__content">
        {/* Account Summary */}
        <div className="account-summary">
          <h3>Account Summary</h3>
          <div className="summary-items">
            <div className="summary-item">
              <span className="summary-label">Name:</span>
              <span className="summary-value">{watch('firstName')} {watch('lastName')}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Username:</span>
              <span className="summary-value">@{watch('username')}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Email:</span>
              <span className="summary-value">{watch('email')}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="terms-section">
          <div className="terms-content">
            <h4>Terms of Service</h4>
            <div className="terms-text">
              <p>By creating an account, you agree to our Terms of Service and Privacy Policy. Here are the key points:</p>
              <ul>
                <li>You must be at least 13 years old to use this service</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You agree not to use the service for illegal or harmful activities</li>
                <li>We respect your privacy and will not share your personal information</li>
                <li>You can delete your account at any time from the settings</li>
              </ul>
            </div>
          </div>

          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="terms-checkbox__input"
            />
            <span className="terms-checkbox__checkmark"></span>
            <span className="terms-checkbox__label">
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="terms-link">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" className="terms-link">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left side - Branding */}
        <div className="signup-branding">
          <div className="signup-branding__content">
            <div className="signup-branding__icon">
              <MessageCircle size={48} />
            </div>
            <h1 className="signup-branding__title">Join Chat App</h1>
            <p className="signup-branding__subtitle">
              Create your account and start connecting with friends and colleagues around the world.
            </p>
            
            {/* Progress Steps */}
            <div className="signup-progress">
              <div className="progress-steps">
                <div className={`progress-step ${step >= 1 ? 'progress-step--active' : ''}`}>
                  <div className="progress-step__number">
                    {step > 1 ? <CheckCircle size={16} /> : '1'}
                  </div>
                  <span className="progress-step__label">Personal Info</span>
                </div>
                <div className={`progress-step ${step >= 2 ? 'progress-step--active' : ''}`}>
                  <div className="progress-step__number">
                    {step > 2 ? <CheckCircle size={16} /> : '2'}
                  </div>
                  <span className="progress-step__label">Credentials</span>
                </div>
                <div className={`progress-step ${step >= 3 ? 'progress-step--active' : ''}`}>
                  <div className="progress-step__number">3</div>
                  <span className="progress-step__label">Terms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Signup form */}
        <div className="signup-form-section">
          <div className="signup-form-container">
            <div className="signup-form-header">
              <h2 className="signup-form-title">
                Step {step} of 3
              </h2>
              <p className="signup-form-subtitle">
                {step === 1 && "Let's get to know you better"}
                {step === 2 && "Secure your account"}
                {step === 3 && "Almost there!"}
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
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <div className="signup-form__actions">
                {step > 1 && (
                  <button
                    type="button"
                    className="signup-button signup-button--outline"
                    onClick={goToPreviousStep}
                  >
                    Back
                  </button>
                )}
                
                <button
                  type="submit"
                  className="signup-button"
                  disabled={loading || isSubmitting || (step === 3 && !acceptedTerms)}
                >
                  {loading || isSubmitting ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : step === 3 ? (
                    'Create Account'
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>

            <div className="signup-footer">
              <p className="signup-footer__text">
                Already have an account?{' '}
                <Link to="/login" className="signup-footer__link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;