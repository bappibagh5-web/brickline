'use client';

import { useActionState } from 'react';
import { addNoteAction, type ActionState } from '@/app/actions';
import type { AppRole } from '@/lib/types';

const initialState: ActionState = {};

type NoteFormProps = {
  applicationId: string;
  role: AppRole;
};

export function NoteForm({ applicationId, role }: NoteFormProps) {
  const [state, formAction, pending] = useActionState(addNoteAction, initialState);

  return (
    <form action={formAction} className="mt-3 grid gap-2 md:grid-cols-[160px_1fr_auto]">
      <input type="hidden" name="application_id" value={applicationId} />
      <select name="note_type" className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue="borrower_visible">
        <option value="borrower_visible">Borrower Visible</option>
        {role !== 'broker' ? <option value="internal">Internal</option> : null}
      </select>
      <input name="content" required placeholder="Add note" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={pending} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
        Add Note
      </button>
      {state.error ? <p className="md:col-span-3 text-xs text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-3 text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
