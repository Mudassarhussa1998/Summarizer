import api from './axios';

export interface OTPVerificationData {
  email: string;
  otp: string;
}

export interface OTPResponse {
  message: string;
  error?: string;
}

/**
 * Verify OTP for email verification
 * @param data - Email and OTP data
 * @returns Promise with verification response
 */
export const verifyOTP = async (data: OTPVerificationData): Promise<OTPResponse> => {
  try {
    const response = await api.post('/api/auth/verify-otp', data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'OTP verification failed');
    }
    throw new Error('Network error occurred');
  }
};

/**
 * Resend OTP to email (if backend supports this functionality)
 * @param email - User email
 * @returns Promise with resend response
 */
export const resendOTP = async (email: string): Promise<OTPResponse> => {
  try {
    const response = await api.post('/api/auth/resend-otp', { email });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to resend OTP');
    }
    throw new Error('Network error occurred');
  }
};