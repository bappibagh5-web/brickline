function formatMoney(value) {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(safeValue);
}

function formatRate(value) {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return `${safeValue.toFixed(2)}%`;
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <p className={`text-sm ${strong ? 'font-semibold text-[#1f2937]' : 'text-[#4b5563]'}`}>{label}</p>
      <p className={`text-sm ${strong ? 'font-semibold text-[#1f2937]' : 'text-[#1f2937]'}`}>{value}</p>
    </div>
  );
}

export default function SubmissionStep({
  summary,
  onGoBack,
  onSubmit,
  submitting,
  submitError,
  submitSuccess
}) {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-[clamp(34px,3.1vw,48px)] font-bold leading-tight tracking-[-0.02em] text-[#0b1f57]">
        Review Your Loan Details.
      </h1>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#e7ebf4] pb-3">
            <p className="text-base font-semibold text-[#1f2937]">{summary.entity_name}</p>
            <p className="mt-1 text-xs text-[#5f6b8f]">{summary.property_address}</p>
            <p className="mt-1 text-xs text-[#5f6b8f]">Property Type: {summary.property_type}</p>
          </div>

          <div className="border-b border-[#e7ebf4] py-3">
            <SummaryRow label="Total Loan Amount" value={formatMoney(summary.total_loan_amount)} strong />
            <SummaryRow label="Purchase Loan Amount" value={formatMoney(summary.purchase_loan_amount)} />
            <SummaryRow label="Rehab Holdback" value={formatMoney(summary.rehab_holdback)} />
          </div>

          <div className="border-b border-[#e7ebf4] py-3">
            <SummaryRow label="Estimated Monthly Payment" value={formatMoney(summary.estimated_monthly_payment)} strong />
            <SummaryRow label="Interest Rate" value={formatRate(summary.interest_rate)} strong />
          </div>

          <div className="pt-3">
            <SummaryRow label="Estimated Cash Required at Closing" value={formatMoney(summary.estimated_cash_required)} strong />
            <SummaryRow label="Down Payment" value={formatMoney(summary.down_payment)} />
            <SummaryRow label="Origination Fee" value={formatMoney(summary.origination_fee)} />
            <SummaryRow label="Service Fee" value={formatMoney(summary.service_fee)} />
          </div>
        </section>

        <aside className="space-y-3">
          <p className="text-base leading-7 text-[#374151]">
            Please make sure your borrower and guarantor information is correct. In order to process your
            application quickly you can&apos;t make changes once submitted.
          </p>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-5 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>

          <p className="text-xs leading-6 text-[#4b5563]">
            By submitting for review you agree to the E-Sign Consent, Information Certification and
            Authorization Agreement, Refund Policy, Privacy Policy, Terms of Use, and State Disclosure.
          </p>

          {submitSuccess ? (
            <p className="text-sm font-semibold text-[#1f7a55]">Your loan has been submitted successfully.</p>
          ) : null}
          {submitError ? <p className="text-sm font-semibold text-[#b63d3d]">{submitError}</p> : null}

          <button
            type="button"
            onClick={onGoBack}
            className="text-sm font-medium text-[#0f766e] underline underline-offset-2"
          >
            Go Back
          </button>
        </aside>
      </div>
    </div>
  );
}
