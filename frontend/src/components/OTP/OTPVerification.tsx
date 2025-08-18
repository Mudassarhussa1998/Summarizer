import React, { useState, useRef, useEffect } from 'react';
import { verifyOTP, resendOTP } from '../../api/otpApi';
import './OTPVerification.css';
import Alert from '../Alert/Alert';
import { useAlert } from '../../hooks/useAlert';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  email, 
  onVerificationSuccess, 
  onBack 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const { alert, showSuccess, showError, hideAlert } = useAlert();
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    hideAlert();

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    hideAlert();

    try {
      await verifyOTP({ email, otp: otpString });
      showSuccess('Email verified successfully!');
      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    hideAlert();

    try {
      await resendOTP(email);
      showSuccess('OTP sent successfully!');
      setResendCooldown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']); // Clear current OTP
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      showError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-verification">
      <div className="otp-page-container">
        <div className="otp-left-section">
          <div className="otp-design">
            <h1 className="otp-brand-title">Almost There!</h1>
            <p className="otp-brand-subtitle">Verify your email to complete registration</p>
          </div>
        </div>
        <div className="otp-right-section">
          <div className="otp-container">
            <div className="otp-header">
              <h2>Verify Your Email</h2>
              <p>We've sent a 6-digit code to</p>
              <p className="email-display">{email}</p>
            </div>

            <form onSubmit={handleSubmit} className="otp-form">
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="otp-input"
                    disabled={isLoading}
                  />
                ))}
              </div>



              <button 
                type="submit" 
                className="verify-btn"
                disabled={isLoading || otp.join('').length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="otp-actions">
              <p>Didn't receive the code?</p>
              <button 
                type="button"
                onClick={handleResendOTP}
                className="resend-btn"
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : 'Resend Code'
                }
              </button>
            </div>

            <button 
              type="button"
              onClick={onBack}
              className="back-btn"
              disabled={isLoading}
            >
              ← Back to Sign Up
            </button>
          </div>
        </div>
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

export default OTPVerification;