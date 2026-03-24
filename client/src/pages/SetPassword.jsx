import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getStoredApplicationId,
  getStoredFunnelEmail,
  setStoredApplicationId,
  setStoredFunnelEmail
} from '../funnel/session.js';
import { getRoleHomeRoute } from '../lib/roleRouting.js';
import { supabase } from '../lib/supabaseClient.js';

export default function SetPassword() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, loading } = useAuth();

  const applicationId = useMemo(
    () => searchParams.get('applicationId') || getStoredApplicationId() || '',
    [searchParams]
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!applicationId) {
      setEmail(getStoredFunnelEmail() || '');
      setInitializing(false);
      return;
    }

    setStoredApplicationId(applicationId);

    let ignore = false;
    const loadEmail = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`);
        if (!response.ok) {
          if (!ignore) {
            setEmail(getStoredFunnelEmail() || '');
          }
          return;
        }

        const payload = await response.json();
        const fetchedEmail = payload?.application_data?.email || '';
        if (!ignore) {
          if (fetchedEmail) {
            setEmail(fetchedEmail);
            setStoredFunnelEmail(fetchedEmail);
          } else {
            setEmail(getStoredFunnelEmail() || '');
          }
        }
      } catch (_err) {
        if (!ignore) {
          setEmail(getStoredFunnelEmail() || '');
        }
      } finally {
        if (!ignore) {
          setInitializing(false);
        }
      }
    };

    loadEmail();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, applicationId]);

  if (!loading && user) {
    return <Navigate to={getRoleHomeRoute(role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!applicationId) {
      setError('Missing applicationId in URL.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const createResponse = await fetch(`${apiBaseUrl}/applications/${applicationId}/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      if (!createResponse.ok) {
        const payload = await createResponse.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to create account.');
      }

      const signInResult = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInResult.error) {
        throw signInResult.error;
      }

      setStoredFunnelEmail(email.trim());
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6fc] px-4">
      <div className="panel w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-[#1f2747]">Create your account</h1>
        <p className="mt-2 text-sm text-[#667397]">
          Create a password to save your application and continue to your dashboard.
        </p>

        {initializing ? (
          <p className="mt-6 text-sm text-[#60709a]">Loading application details...</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#344064]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#dbe2ef] px-3 text-sm text-[#1f2747] focus:border-[#4063ee] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#344064]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#dbe2ef] px-3 text-sm text-[#1f2747] focus:border-[#4063ee] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#344064]" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#dbe2ef] px-3 text-sm text-[#1f2747] focus:border-[#4063ee] focus:outline-none"
              />
            </div>

            {error ? <p className="text-sm font-medium text-[#b63d3d]">{error}</p> : null}

            <button type="submit" disabled={submitting} className="topbar-btn w-full justify-center">
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
