'use client';

import { useMemo, useState } from 'react';
import { LOAN_TYPE_LABELS, MAX_STEP, normalizeNumber, validateStep } from '@/lib/intake';
import type { AppRole, ApplicationRecord, ExitStrategy, IntakeData, LoanType } from '@/lib/types';

type MultiStepIntakeFormProps = {
  application: ApplicationRecord;
  role: AppRole;
  canEdit: boolean;
  initialStep: number;
};

const stepLabels = ['Basic Info', 'Loan Type', 'Property Details', 'Loan Details', 'Review & Submit'];

export function MultiStepIntakeForm({ application, role, canEdit, initialStep }: MultiStepIntakeFormProps) {
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), MAX_STEP));
  const [data, setData] = useState<IntakeData>(application.application_data || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loanType = data.loan_type;

  const summaryRows = useMemo(
    () => [
      ['Borrower Name', data.borrower_name || '-'],
      ['Email', data.email || '-'],
      ['Entity Type', data.entity_type || '-'],
      ['Phone', data.phone_number || '-'],
      ['Loan Type', data.loan_type ? LOAN_TYPE_LABELS[data.loan_type] : '-'],
      ['Property Address', data.property_address || '-'],
      ['Purchase Price', data.purchase_price?.toLocaleString() || '-'],
      ['Estimated Value (ARV)', data.estimated_value?.toLocaleString() || '-'],
      ['Property Type', data.property_type || '-'],
      ['Loan Amount Requested', data.loan_amount_requested?.toLocaleString() || '-'],
      ['Down Payment', data.down_payment?.toLocaleString() || '-'],
      ['Exit Strategy', data.exit_strategy || '-'],
      ['Rehab Budget', data.rehab_budget?.toLocaleString() || '-'],
      ['Rental Income', data.rental_income?.toLocaleString() || '-'],
      ['Construction Timeline', data.construction_timeline || '-'],
      ['Construction Budget', data.construction_budget?.toLocaleString() || '-']
    ],
    [data]
  );

  function setField<K extends keyof IntakeData>(field: K, value: IntakeData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function persistCurrentStep(saveOnly: boolean, nextStep?: number) {
    setSaving(true);
    setError('');
    setSuccess('');

    const clientErrors = saveOnly ? [] : validateStep(step, data);
    if (clientErrors.length) {
      setSaving(false);
      setError(clientErrors[0]);
      return;
    }

    const response = await fetch(`/api/applications/${application.id}/save-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, data, saveOnly })
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || (payload.errors || []).join(' ') || 'Unable to save progress.');
      return;
    }

    if (payload.application?.application_data) {
      setData(payload.application.application_data);
    }

    if (nextStep) {
      setStep(nextStep);
      window.history.replaceState(null, '', `?step=${nextStep}`);
      setSuccess('Progress saved.');
      return;
    }

    setSuccess('Saved. You can continue later.');
  }

  async function submitApplication() {
    setSaving(true);
    setError('');
    setSuccess('');

    const response = await fetch(`/api/applications/${application.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || (payload.errors || []).join(' ') || 'Unable to submit.');
      return;
    }

    setSuccess('Application submitted successfully.');
    const returnPath = role === 'borrower' ? '/borrower' : role === 'broker' ? '/broker' : '/admin';
    setTimeout(() => {
      window.location.href = returnPath;
    }, 800);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap gap-2">
        {stepLabels.map((label, index) => {
          const stepIndex = index + 1;
          const active = stepIndex === step;
          const complete = stepIndex < step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStep(stepIndex)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                active ? 'bg-brand-700 text-white' : complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {stepIndex}. {label}
            </button>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-700">Borrower Name</label>
            <input
              value={data.borrower_name || ''}
              onChange={(event) => setField('borrower_name', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Email</label>
            <input
              type="email"
              value={data.email || ''}
              onChange={(event) => setField('email', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Entity Type</label>
            <select
              value={data.entity_type || 'individual'}
              onChange={(event) => setField('entity_type', event.target.value as IntakeData['entity_type'])}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            >
              <option value="individual">Individual</option>
              <option value="llc">LLC</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-700">Phone Number</label>
            <input
              value={data.phone_number || ''}
              onChange={(event) => setField('phone_number', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(LOAN_TYPE_LABELS) as LoanType[]).map((type) => (
            <button
              key={type}
              type="button"
              disabled={!canEdit}
              onClick={() => setField('loan_type', type)}
              className={`rounded-md border px-4 py-3 text-left ${
                data.loan_type === type ? 'border-brand-700 bg-brand-50 text-brand-900' : 'border-slate-300 text-slate-700'
              } disabled:opacity-60`}
            >
              <p className="font-medium">{LOAN_TYPE_LABELS[type]}</p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-slate-700">Property Address</label>
            <input
              value={data.property_address || ''}
              onChange={(event) => setField('property_address', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Purchase Price</label>
            <input
              type="number"
              value={data.purchase_price ?? ''}
              onChange={(event) => setField('purchase_price', normalizeNumber(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Estimated Value (ARV)</label>
            <input
              type="number"
              value={data.estimated_value ?? ''}
              onChange={(event) => setField('estimated_value', normalizeNumber(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Property Type</label>
            <input
              value={data.property_type || ''}
              onChange={(event) => setField('property_type', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-700">Loan Amount Requested</label>
            <input
              type="number"
              value={data.loan_amount_requested ?? ''}
              onChange={(event) => setField('loan_amount_requested', normalizeNumber(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Down Payment</label>
            <input
              type="number"
              value={data.down_payment ?? ''}
              onChange={(event) => setField('down_payment', normalizeNumber(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Exit Strategy</label>
            <select
              value={data.exit_strategy || ''}
              onChange={(event) => setField('exit_strategy', event.target.value as ExitStrategy)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={!canEdit}
            >
              <option value="">Select strategy</option>
              <option value="sell">Sell</option>
              <option value="refinance">Refinance</option>
              <option value="rent">Rent</option>
            </select>
          </div>

          {loanType === 'fix_flip' ? (
            <div>
              <label className="text-sm text-slate-700">Rehab Budget</label>
              <input
                type="number"
                value={data.rehab_budget ?? ''}
                onChange={(event) => setField('rehab_budget', normalizeNumber(event.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                disabled={!canEdit}
              />
            </div>
          ) : null}

          {loanType === 'dscr' ? (
            <div>
              <label className="text-sm text-slate-700">Rental Income</label>
              <input
                type="number"
                value={data.rental_income ?? ''}
                onChange={(event) => setField('rental_income', normalizeNumber(event.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                disabled={!canEdit}
              />
            </div>
          ) : null}

          {loanType === 'construction' ? (
            <>
              <div>
                <label className="text-sm text-slate-700">Construction Timeline</label>
                <input
                  value={data.construction_timeline || ''}
                  onChange={(event) => setField('construction_timeline', event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">Construction Budget</label>
                <input
                  type="number"
                  value={data.construction_budget ?? ''}
                  onChange={(event) => setField('construction_budget', normalizeNumber(event.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  disabled={!canEdit}
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {step === 5 ? (
        <div>
          <p className="text-sm text-slate-600">Review the application summary before final submission.</p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {summaryRows.map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
      {!canEdit ? <p className="mt-4 text-sm text-amber-700">This application is locked for editing in your role.</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          disabled={step === 1 || saving}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
        >
          Previous
        </button>

        {step < 5 ? (
          <button
            type="button"
            disabled={saving || !canEdit}
            onClick={() => persistCurrentStep(false, Math.min(5, step + 1))}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            Save & Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={saving || !canEdit}
            onClick={submitApplication}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            Submit Application
          </button>
        )}

        <button
          type="button"
          disabled={saving || !canEdit}
          onClick={() => persistCurrentStep(true)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
        >
          Save & Continue Later
        </button>
      </div>
    </div>
  );
}
