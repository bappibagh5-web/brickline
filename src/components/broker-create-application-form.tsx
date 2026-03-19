'use client';

import { useActionState } from 'react';
import { createApplicationAction, type ActionState } from '@/app/actions';

const initialState: ActionState = {};

export function BrokerCreateApplicationForm() {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Create Borrower Application</h2>
      <p className="mt-1 text-sm text-slate-600">Use the borrower user ID to open a new file under your pipeline.</p>

      <label className="mt-4 block text-sm text-slate-700">Borrower User ID (UUID)</label>
      <input name="borrower_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />

      {state.error ? <p className="mt-3 text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm text-emerald-700">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
      >
        {pending ? 'Creating...' : 'Create Application'}
      </button>
    </form>
  );
}
