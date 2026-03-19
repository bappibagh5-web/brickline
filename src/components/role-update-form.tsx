'use client';

import { useActionState } from 'react';
import { updateUserRoleAction, type ActionState } from '@/app/actions';
import type { AppRole } from '@/lib/types';

const initialState: ActionState = {};

type RoleUpdateFormProps = {
  profileId: string;
  currentRole: AppRole;
};

export function RoleUpdateForm({ profileId, currentRole }: RoleUpdateFormProps) {
  const [state, formAction, pending] = useActionState(updateUserRoleAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="profile_id" value={profileId} />
      <select name="role" defaultValue={currentRole} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
        <option value="borrower">Borrower</option>
        <option value="broker">Broker</option>
        <option value="admin">Admin</option>
        <option value="lender">Lender</option>
        <option value="super_admin">Super Admin</option>
      </select>
      <button type="submit" disabled={pending} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-60">
        Save
      </button>
      {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
