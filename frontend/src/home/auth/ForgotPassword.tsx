import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/forgot', { email: email.trim() });
      if (response.data.otpToken) {
        setOtpToken(response.data.otpToken);
        setStep(2);
        setMessage('An OTP has been sent to your email.');
      } else {
        setMessage(response.data.message || 'If an account exists, a reset email has been sent.');
      }
    } catch (err: any) {
      console.error('Forgot error', err);
      setError(err?.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp.trim() || otp.length !== 4) {
      setError('Valid 4-digit OTP is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/verify-otp', { otpToken, otp: otp.trim() });
      if (response.data.resetToken) {
        setMessage('OTP verified successfully! Redirecting...');
        setTimeout(() => {
          navigate(`/reset-password?token=${response.data.resetToken}`);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Verify OTP error', err);
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500/80 via-purple-600/80 to-purple-800/80">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4">Forgot Password</h2>
        {message ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{message}</div>
        ) : null}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">{error}</div>
        ) : null}

        {step === 1 ? (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20 outline-none focus:border-white/50"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#6D30D4] text-white font-semibold disabled:opacity-50 hover:bg-[#5b28b3] transition-colors"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>

            <div className="text-sm text-white/80 text-center mt-4">
              <Link to="/login" className="underline hover:text-white transition-colors">Back to login</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                type="text"
                maxLength={4}
                placeholder="Enter 4-digit OTP"
                className="w-full px-4 py-3 text-center tracking-widest text-xl rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20 outline-none focus:border-white/50"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#6D30D4] text-white font-semibold disabled:opacity-50 hover:bg-[#5b28b3] transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>

            <div className="text-sm text-white/80 text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setStep(1); setOtp(''); setMessage(''); setError(''); }} 
                className="underline hover:text-white transition-colors"
              >
                Change Email / Resend
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
