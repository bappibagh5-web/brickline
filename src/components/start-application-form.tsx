'use client';

import { useMemo, useState } from 'react';
import type { AppRole, EntityType, LoanType } from '@/lib/types';

type BorrowerOption = {
  id: string;
  full_name: string;
  email: string;
};

type StartApplicationFormProps = {
  role: AppRole;
  borrowerOptions?: BorrowerOption[];
};

export function StartApplicationForm({ role, borrowerOptions = [] }: StartApplicationFormProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [borrowerId, setBorrowerId] = useState(borrowerOptions[0]?.id ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canCreateForOthers = role === 'broker' || role === 'admin' || role === 'super_admin';

  const defaultLoanType = useMemo<LoanType>(() => 'fix_flip', []);

  async function onCreate() {
    setLoading(true);
    setError('');

    const payload: Record<string, unknown> = {
      mode: canCreateForOthers ? mode : 'self',
      borrower_id: borrowerId || null,
      new_borrower: {
        borrower_name: name,
        email,
        phone_number: phone,
        entity_type: entityType
      },
      loan_type: defaultLoanType
    };

    const res = await fetch('/api/applications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || 'Unable to create application.');
      return;
    }

    window.location.href = `/applications/${json.applicationId}/intake`;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Start New Loan Application</h2>
      <p className="mt-1 text-sm text-slate-600">Create an intake record and continue step-by-step.</p>

      {canCreateForOthers ? (
        <>
          <div className="mt-4 flex gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} />
              Select Existing Borrower
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} />
              Create New Borrower
            </label>
          </div>

          {mode === 'existing' ? (
            <div className="mt-4">
              <label className="text-sm text-slate-700">Borrower</label>
              <select
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Select borrower</option>
                {borrowerOptions.map((borrower) => (
                  <option key={borrower.id} value={borrower.id}>
                    {borrower.full_name} ({borrower.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-700">Borrower Name</label>
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-slate-700">Email</label>
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="email" />
              </div>
              <div>
                <label className="text-sm text-slate-700">Phone</label>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-slate-700">Entity Type</label>
                <select
                  value={entityType}
                  onChange={(event) => setEntityType(event.target.value as EntityType)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                >
                  <option value="individual">Individual</option>
                  <option value="llc">LLC</option>
                </select>
              </div>
            </div>
          )}
        </>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <button
        type="button"
        onClick={onCreate}
        disabled={loading}
        className="mt-4 rounded-md bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
      >
        {loading ? 'Creating...' : 'Create Application'}
      </button>
    </div>
  );
}
