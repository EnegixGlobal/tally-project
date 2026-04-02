import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setError('Invalid or missing token');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword) {
      setError('Password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/reset', { token, newPassword });
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err: any) {
      console.error('Reset error', err);
      setError(err?.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500/80 via-purple-600/80 to-purple-800/80">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
        {message ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{message}</div>
        ) : null}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">{error}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="New password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20"
            />
          </div>

          <div>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirm password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3 rounded-xl bg-[#6D30D4] text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </div>

          <div className="text-sm text-white/80 text-center">
            <Link to="/login" className="underline">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
