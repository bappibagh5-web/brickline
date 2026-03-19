'use client';

import { useActionState } from 'react';
import { uploadDocumentAction, type ActionState } from '@/app/actions';

type DocumentUploadFormProps = {
  applications: { id: string; label: string }[];
};

const initialState: ActionState = {};

export function DocumentUploadForm({ applications }: DocumentUploadFormProps) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
      <p className="mt-1 text-sm text-slate-600">Attach files to an application.</p>

      <label className="mt-4 block text-sm text-slate-700">Application</label>
      <select name="application_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
        <option value="">Select an application</option>
        {applications.map((application) => (
          <option key={application.id} value={application.id}>
            {application.label}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-sm text-slate-700">Document Type</label>
      <input
        name="document_type"
        required
        placeholder="purchase_contract, rehab_budget, rent_roll"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
      />

      <label className="mt-4 block text-sm text-slate-700">File</label>
      <input name="file" type="file" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />

      {state.error ? <p className="mt-3 text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm text-emerald-700">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
      >
        {pending ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
}
