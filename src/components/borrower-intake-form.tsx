'use client';

import { useActionState } from 'react';
import { createApplicationAction, type ActionState } from '@/app/actions';

const initialState: ActionState = {};

type BorrowerIntakeFormProps = {
  borrowerId: string;
};

export function BorrowerIntakeForm({ borrowerId }: BorrowerIntakeFormProps) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="borrower_id" value={borrowerId} />
      <h2 className="text-lg font-semibold text-slate-900">New Application</h2>
      <p className="mt-1 text-sm text-slate-600">Create a loan application linked to your borrower account.</p>

      {state.error ? <p className="mt-4 text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="mt-4 text-sm text-emerald-700">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-md bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
      >
        {pending ? 'Submitting...' : 'Create Application'}
      </button>
    </form>
  );
}
