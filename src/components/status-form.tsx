'use client';

import { useActionState } from 'react';
import { updateApplicationStatusAction, type ActionState } from '@/app/actions';
import type { ApplicationStatus } from '@/lib/types';

const initialState: ActionState = {};

type StatusFormProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

export function StatusForm({ applicationId, currentStatus }: StatusFormProps) {
  const [state, formAction, pending] = useActionState(updateApplicationStatusAction, initialState);

  return (
    <form action={formAction} className="mt-3 grid gap-2 md:grid-cols-[180px_auto]">
      <input type="hidden" name="application_id" value={applicationId} />
      <select name="status" defaultValue={currentStatus} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="draft">Draft</option>
        <option value="submitted">Submitted</option>
        <option value="in_review">In Review</option>
        <option value="missing_items">Missing Items</option>
        <option value="completed">Completed</option>
      </select>
      <button type="submit" disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60">
        Update Status
      </button>
      {state.error ? <p className="md:col-span-2 text-xs text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
