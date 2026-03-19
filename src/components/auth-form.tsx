'use client';

import { useActionState } from 'react';
import { loginAction, signupAction, type ActionState } from '@/app/actions';

const initialState: ActionState = {};

export function AuthForm() {
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [signupState, signupFormAction, signupPending] = useActionState(signupAction, initialState);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form action={loginFormAction} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Sign In</h2>
        <p className="mt-1 text-sm text-slate-600">Access your role dashboard.</p>

        <label className="mt-4 block text-sm text-slate-700">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />

        <label className="mt-4 block text-sm text-slate-700">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />

        {loginState.error ? <p className="mt-3 text-sm text-rose-600">{loginState.error}</p> : null}

        <button
          type="submit"
          disabled={loginPending}
          className="mt-4 w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {loginPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <form action={signupFormAction} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create Account</h2>
        <p className="mt-1 text-sm text-slate-600">Every account gets a role in `user_profiles`.</p>

        <label className="mt-4 block text-sm text-slate-700">Full Name</label>
        <input name="full_name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />

        <label className="mt-4 block text-sm text-slate-700">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />

        <label className="mt-4 block text-sm text-slate-700">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />

        <label className="mt-4 block text-sm text-slate-700">Role</label>
        <select name="role" defaultValue="borrower" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
          <option value="borrower">Borrower</option>
          <option value="broker">Broker</option>
          <option value="admin">Admin</option>
          <option value="lender">Lender</option>
          <option value="super_admin">Super Admin</option>
        </select>

        {signupState.error ? <p className="mt-3 text-sm text-rose-600">{signupState.error}</p> : null}
        {signupState.success ? <p className="mt-3 text-sm text-emerald-700">{signupState.success}</p> : null}

        <button
          type="submit"
          disabled={signupPending}
          className="mt-4 w-full rounded-md border border-brand-700 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
        >
          {signupPending ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
