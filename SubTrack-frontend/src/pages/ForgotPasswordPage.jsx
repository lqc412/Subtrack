import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!email) {
      setStatus({ type: 'error', message: 'Please enter the email associated with your account.' });
      return;
    }

    try {
      setSubmitting(true);
      await requestPasswordReset(email);
      setStatus({
        type: 'success',
        message: 'If an account exists for that email, password reset instructions have been sent.'
      });
    } catch (error) {
      console.error('Failed to request password reset:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'We were unable to process your request. Please try again later.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-full max-w-md">
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {status.message && (
          <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
            <span>{status.message}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              id="email"
              className="input input-bordered w-full mt-1"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Send reset instructions'}
          </button>
        </form>

        <div className="text-sm text-center text-gray-600 mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
