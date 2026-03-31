import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/request-otp', {
        email,
        purpose: 'email_verification'
      });
      toast.success(response.data.message);
      setOtpSent(true);
      setResendTimer(120); // 2 minutes
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/verify-otp', {
        email,
        code: otp,
        purpose: 'email_verification'
      });
      toast.success('Email verified successfully!');
      await checkAuth(); // Update user context
      // Navigate to dashboard after successful verification
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Mail className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification code to your email address
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-md sm:text-sm cursor-not-allowed"
            />
          </div>

          {!otpSent ? (
            <button
              onClick={sendOtp}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          ) : (
            <>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                onClick={sendOtp}
                disabled={loading || resendTimer > 0}
                className="w-full text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendTimer > 0 ? `Resend Code in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}` : 'Resend Code'}
              </button>
            </>
          )}

          <div className="text-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;