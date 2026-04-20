function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value));
}

const US_STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

const PROPERTY_TYPE_OPTIONS = [
  'Single Family',
  'Townhouse',
  'Condo',
  '2-4 unit',
  '5-30 unit',
  'Manufactured Home'
];

const FICO_OPTIONS = [
  '660-679',
  '680-699',
  '700-719',
  '720-739',
  '740-759',
  '760-779',
  'Over 780'
];

const PREPAYMENT_OPTIONS = ['3-year', '5-year', '7-year'];

function FieldLabel({ children }) {
  return <span className="text-sm font-medium text-[#374151]">{children}</span>;
}

export default function DscrCalculatorForm({
  form,
  metrics,
  loading,
  showDscrSection,
  onToggleDscrSection,
  onFormChange
}) {
  const isRefinance = form.refinance === 'yes';
  const inputClass =
    'h-9 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-sm text-[#1f2937] transition-colors focus:border-[#9ca3af] focus:outline-none';

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:px-5">
      <h2 className="mb-3 text-lg font-semibold leading-tight text-[#1f2937]">Borrower Information</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1.5">
          <FieldLabel>Property State</FieldLabel>
          <select
            value={form.property_state}
            onChange={(event) => onFormChange('property_state', event.target.value)}
            className={inputClass}
          >
            <option value="">Select state</option>
            {US_STATE_OPTIONS.map((stateCode) => (
              <option key={stateCode} value={stateCode}>
                {stateCode}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <FieldLabel>Property Type</FieldLabel>
          <select
            value={form.property_type}
            onChange={(event) => onFormChange('property_type', event.target.value)}
            className={inputClass}
          >
            <option value="">Select property type</option>
            {PROPERTY_TYPE_OPTIONS.map((propertyTypeOption) => (
              <option key={propertyTypeOption} value={propertyTypeOption}>
                {propertyTypeOption}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <FieldLabel>Est. FICO Score</FieldLabel>
          <select
            value={form.fico_bucket}
            onChange={(event) => onFormChange('fico_bucket', event.target.value)}
            className={inputClass}
          >
            <option value="">Select</option>
            {FICO_OPTIONS.map((ficoOption) => (
              <option key={ficoOption} value={ficoOption}>
                {ficoOption}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <FieldLabel>Loan Amount</FieldLabel>
          <input
            type="text"
            value={form.loan_amount}
            onChange={(event) => onFormChange('loan_amount', event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="grid gap-1.5">
          <FieldLabel>Refinance</FieldLabel>
          <select
            value={form.refinance}
            onChange={(event) => onFormChange('refinance', event.target.value)}
            className={inputClass}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>

        {isRefinance ? (
          <>
            <label className="grid gap-1.5">
              <FieldLabel>Estimated Home Value</FieldLabel>
              <input
                type="text"
                value={form.estimated_property_value}
                onChange={(event) => onFormChange('estimated_property_value', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>Remaining Mortgage</FieldLabel>
              <input
                type="text"
                value={form.remaining_mortgage}
                onChange={(event) => onFormChange('remaining_mortgage', event.target.value)}
                className={inputClass}
              />
            </label>
          </>
        ) : (
          <label className="grid gap-1.5">
            <FieldLabel>Purchase Price</FieldLabel>
            <input
              type="text"
              value={form.purchase_price}
              onChange={(event) => onFormChange('purchase_price', event.target.value)}
              className={inputClass}
            />
          </label>
        )}

        <label className="grid gap-1.5">
          <FieldLabel>Prepayment Penalty</FieldLabel>
          <select
            value={form.prepayment_penalty}
            onChange={(event) => onFormChange('prepayment_penalty', event.target.value)}
            className={inputClass}
          >
            {PREPAYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} term
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-md border border-[#d6ebe5] bg-[#e9f8f3] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#245b54]">Debt Service Coverage Ratio</p>
          <button
            type="button"
            onClick={onToggleDscrSection}
            className="h-7 rounded-md border border-[#1d7467] px-3 text-xs font-semibold text-[#1d7467] transition-colors hover:bg-[#d7f3ec]"
          >
            {showDscrSection ? 'Hide DSCR Info' : 'Add DSCR Information'}
          </button>
        </div>

        {showDscrSection ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1.5">
              <FieldLabel>Monthly Rent</FieldLabel>
              <input
                type="text"
                value={form.monthly_rent}
                onChange={(event) => onFormChange('monthly_rent', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>Annual Insurance</FieldLabel>
              <input
                type="text"
                value={form.annual_insurance}
                onChange={(event) => onFormChange('annual_insurance', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>Annual Taxes</FieldLabel>
              <input
                type="text"
                value={form.annual_taxes}
                onChange={(event) => onFormChange('annual_taxes', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>Monthly HOA</FieldLabel>
              <input
                type="text"
                value={form.monthly_hoa}
                onChange={(event) => onFormChange('monthly_hoa', event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-[#6b7280]">
        {loading ? 'Rates are being calculated...' : 'Rates have been calculated'}
      </p>
      <p className="mt-1 text-xs text-[#6b7280]">
        Loan-to-value:{' '}
        <span className="font-semibold text-[#374151]">
          {metrics?.ltv !== null && metrics?.ltv !== undefined ? `${Number(metrics.ltv).toFixed(2)}%` : '-'}
        </span>
      </p>
      {metrics?.max_loan ? (
        <p className="mt-1 text-xs text-[#6b7280]">
          Max allowed loan:{' '}
          <span className="font-semibold text-[#374151]">{formatMoney(metrics.max_loan)}</span>
        </p>
      ) : null}
    </section>
  );
}
