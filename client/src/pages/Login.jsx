import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getStoredApplicationId } from '../funnel/session.js';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';
import { getRoleHomeRoute, getUserRole } from '../lib/roleRouting.js';

export default function Login() {
  const apiBaseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) {
    return <Navigate to={getRoleHomeRoute(role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const applicationId = getStoredApplicationId();
    if (applicationId && data?.user?.id) {
      await fetch(`${apiBaseUrl}/applications/${applicationId}/attach-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: data.user.id
        })
      }).catch(() => null);
    }

    const nextRole = getUserRole(data?.user);
    navigate(getRoleHomeRoute(nextRole), { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6fc] px-4">
      <div className="panel w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-[#1f2747]">Login</h1>
        <p className="mt-2 text-sm text-[#667397]">Sign in to access your Brickline dashboard.</p>

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

          {error ? <p className="text-sm font-medium text-[#b63d3d]">{error}</p> : null}

          <button type="submit" disabled={submitting} className="topbar-btn w-full justify-center">
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
