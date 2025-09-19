import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const tokenValue = searchParams.get('token');
    if (tokenValue) {
      setToken(tokenValue);
    } else {
      setStatus({ type: 'error', message: 'Reset link is invalid or has already been used.' });
    }
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!token) {
      setStatus({ type: 'error', message: 'Reset link is invalid or has expired.' });
      return;
    }

    if (!formState.password || formState.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match. Please try again.' });
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword({ token, password: formState.password });
      setStatus({ type: 'success', message: 'Your password has been updated. You can now sign in with the new password.' });

      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (error) {
      console.error('Failed to reset password:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Unable to reset password. Your link may have expired.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-full max-w-md">
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your new password must be at least 6 characters and should be something you haven't used before.
          </p>
        </div>

        {status.message && (
          <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
            <span>{status.message}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input input-bordered w-full mt-1"
              value={formState.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="input input-bordered w-full mt-1"
              value={formState.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting || !token}
          >
            {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Update password'}
          </button>
        </form>

        <div className="text-sm text-center text-gray-600 mt-6">
          Not working?{' '}
          <Link to="/forgot-password" className="text-primary hover:underline">Request a new reset link</Link>
        </div>
      </div>
    </div>
  );
}
