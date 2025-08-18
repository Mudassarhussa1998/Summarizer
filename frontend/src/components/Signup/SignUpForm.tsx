import React, { useState } from 'react';
import { useAuth } from '../../contexts';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import OTPVerification from '../OTP/OTPVerification';
import Alert from '../Alert/Alert';
import { useAlert } from '../../hooks/useAlert';

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  photo: File | null;
}

interface SignUpErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  photo?: string;
}

const SignUpForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { alert, showSuccess, showError, hideAlert } = useAlert();
  const [form, setForm] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    photo: null
  });
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear error when user starts typing
    if (errors[name as keyof SignUpErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, photo: 'Please select a valid image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, photo: 'Image size must be less than 5MB' });
        return;
      }

      setForm({ ...form, photo: file });
      setErrors({ ...errors, photo: undefined });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SignUpErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let photoData = '';
      
      // Convert photo to base64 if provided
      if (form.photo) {
        photoData = await convertFileToBase64(form.photo);
      }

      const registrationData = {
        name: form.name,
        email: form.email,
        password: form.password,
        photo: photoData
      };

      const result = await registerUser(registrationData);
      // Registration successful
      
      // Store registration data and show OTP verification
      setRegistrationData({ result, formData: registrationData });
      setShowOTPVerification(true);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerificationSuccess = () => {
    // After successful OTP verification, log the user in
    if (registrationData?.result?.token && registrationData?.result?.user) {
      login(registrationData.result.user, registrationData.result.token);
      showSuccess('Email verified and logged in successfully!');
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } else {
      showSuccess('Email verified successfully! Please login.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }
    
    // Reset form state
    setForm({ 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '', 
      photo: null 
    });
    setPhotoPreview(null);
    setShowOTPVerification(false);
    setRegistrationData(null);
  };

  const handleBackToSignup = () => {
    setShowOTPVerification(false);
    setRegistrationData(null);
  };

  // Show OTP verification if registration was successful
  if (showOTPVerification && registrationData) {
    return (
      <OTPVerification
        email={form.email}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onBack={handleBackToSignup}
      />
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-left-section">
        <div className="auth-design">
          <h1 className="auth-brand-title">Join Us Today</h1>
          <p className="auth-brand-subtitle">Create your account to get started</p>
          <div className="auth-decorative-elements">
            <div className="auth-circle auth-circle-1"></div>
            <div className="auth-circle auth-circle-2"></div>
            <div className="auth-circle auth-circle-3"></div>
          </div>
        </div>
      </div>
      <div className="auth-right-section">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-title">Create Account</h2>
        
        <div>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
            autoComplete="name"
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
            autoComplete="email"
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="form-input password-input"
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        <div>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="form-input password-input"
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
        </div>

        <div>
          <label className="file-input-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
              disabled={isLoading}
            />
            <div className="file-input-button">
              <svg className="upload-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="upload-text">
                {form.photo ? 'Change Photo' : 'Upload Photo'}
              </span>
            </div>
          </label>
          {errors.photo && <div className="form-error">{errors.photo}</div>}
          
          {photoPreview && (
            <div className="photo-preview-container">
              <div className="photo-preview-wrapper">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="photo-preview"
                />
                <button 
                  type="button" 
                  className="remove-photo-btn"
                  onClick={() => {
                    setForm({ ...form, photo: null });
                    setPhotoPreview(null);
                  }}
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="form-button"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <div className="form-link">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            disabled={isLoading}
          >
            Login here
          </button>
        </div>
        </form>
      </div>
      <Alert
        message={alert.message}
        type={alert.type}
        isVisible={alert.isVisible}
        onClose={hideAlert}
      />
    </div>
  );
};



export default SignUpForm;