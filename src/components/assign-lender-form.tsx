'use client';

import { useActionState } from 'react';
import { assignLenderAction, type ActionState } from '@/app/actions';

const initialState: ActionState = {};

type AssignLenderFormProps = {
  applicationId: string;
  lenders: { id: string; full_name: string; email: string }[];
};

export function AssignLenderForm({ applicationId, lenders }: AssignLenderFormProps) {
  const [state, formAction, pending] = useActionState(assignLenderAction, initialState);

  if (!lenders.length) {
    return <p className="mt-2 text-xs text-slate-500">No lender users available.</p>;
  }

  return (
    <form action={formAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
      <input type="hidden" name="application_id" value={applicationId} />
      <select name="lender_id" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        {lenders.map((lender) => (
          <option key={lender.id} value={lender.id}>
            {lender.full_name} ({lender.email})
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
        Assign Lender
      </button>
      {state.error ? <p className="md:col-span-2 text-xs text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
