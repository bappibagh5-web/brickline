function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value));
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toFixed(2)}%`;
}

const US_STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

const FICO_OPTIONS = [
  'Below 600',
  '600-619',
  '620-639',
  '640-659',
  '660-679',
  '680-699',
  '700-719',
  '720-739',
  '740-759',
  '760-779',
  'Over 780'
];

const PROPERTY_TYPE_OPTIONS = [
  'Single Family',
  'Townhouse',
  'Condo',
  '2-4 unit',
  '5-30 unit',
  'Manufactured Home'
];

function FieldLabel({ children }) {
  return <span className="text-sm font-medium text-[#374151]">{children}</span>;
}

export default function CalculatorForm({
  form,
  onFormChange,
  metrics,
  loading,
  rehabCostInvalid = false
}) {
  const isRehabDisabled = form.property_rehab === 'no';
  const showArvField = !isRehabDisabled;
  const isRefinance = form.refinance === 'yes';
  const ownedSixMonths = form.owned_six_months === 'yes';
  const showPurchaseLoanAmount = !isRefinance;
  const showRefinanceLoanAmount = isRefinance;
  const showRemainingMortgage = isRefinance && ownedSixMonths;
  const hasCustomState = Boolean(
    form.property_state && !US_STATE_OPTIONS.includes(String(form.property_state).toUpperCase())
  );
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
            {hasCustomState ? <option value={form.property_state}>{form.property_state}</option> : null}
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
            value={form.est_fico}
            onChange={(event) => onFormChange('est_fico', event.target.value)}
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
          <FieldLabel>Personally Guaranteed</FieldLabel>
          <select
            value={form.personally_guaranteed}
            onChange={(event) => onFormChange('personally_guaranteed', event.target.value)}
            className={inputClass}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_180px]">
        <label className="grid gap-1.5">
          <FieldLabel>Refinance</FieldLabel>
          <select
            value={form.refinance}
            onChange={(event) => onFormChange('refinance', event.target.value)}
            className={inputClass}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <FieldLabel>{isRefinance ? 'Estimated Property Value' : 'Purchase Price'}</FieldLabel>
          <input
            type="text"
            value={form.purchase_price}
            onChange={(event) => onFormChange('purchase_price', event.target.value)}
            className={inputClass}
          />
        </label>
        {showPurchaseLoanAmount ? (
          <label className="grid gap-1.5">
            <FieldLabel>Purchase Loan Amount</FieldLabel>
            <input
              type="text"
              value={form.purchase_loan_amount}
              onChange={(event) => onFormChange('purchase_loan_amount', event.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}
        {showRefinanceLoanAmount ? (
          <label className="grid gap-1.5">
            <FieldLabel>Refinance Loan Amount</FieldLabel>
            <input
              type="text"
              value={form.refinance_loan_amount}
              onChange={(event) => onFormChange('refinance_loan_amount', event.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}
        <div className="pt-1 text-xs leading-5 text-[#6b7280] lg:pt-6">
          <p>You qualify for a loan between</p>
          <p className="font-semibold text-[#374151]">
            {formatMoney(metrics?.min_loan)} to {formatMoney(metrics?.max_loan)}.
          </p>
        </div>
      </div>

      {isRefinance ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_180px]">
          <label className="grid gap-1.5">
            <FieldLabel>Prop. Owned ≥ 6 Months</FieldLabel>
            <select
              value={form.owned_six_months}
              onChange={(event) => onFormChange('owned_six_months', event.target.value)}
              className={inputClass}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          {showRemainingMortgage ? (
            <label className="grid gap-1.5">
              <FieldLabel>Remaining Mortgage</FieldLabel>
              <input
                type="text"
                value={form.remaining_mortgage}
                onChange={(event) => onFormChange('remaining_mortgage', event.target.value)}
                className={inputClass}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_180px]">
        <label className="grid gap-1.5">
          <FieldLabel>Property Rehab</FieldLabel>
          <select
            value={form.property_rehab}
            onChange={(event) => onFormChange('property_rehab', event.target.value)}
            className={inputClass}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <FieldLabel>
            Estimated Cost of Rehab {isRehabDisabled ? '(Locked)' : ''}
          </FieldLabel>
          <input
            type="text"
            value={isRehabDisabled ? '$0' : form.rehab_budget}
            onChange={(event) => onFormChange('rehab_budget', event.target.value)}
            disabled={isRehabDisabled}
            readOnly={isRehabDisabled}
            aria-disabled={isRehabDisabled}
            className={`${inputClass} ${
              isRehabDisabled
                ? 'cursor-not-allowed border-[#a8b2c2] bg-[#e5e7eb] text-[#6b7280]'
                : rehabCostInvalid
                  ? 'border-[#ef4444] ring-1 ring-[#ef4444]'
                  : ''
            }`}
          />
        </label>
        {showArvField ? (
          <label className="grid gap-1.5">
            <FieldLabel>After Repair Value (ARV)</FieldLabel>
            <input
              type="text"
              value={form.comp_value}
              onChange={(event) => onFormChange('comp_value', event.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}
        <div className="pt-1 text-xs leading-5 text-[#6b7280] lg:pt-6">
          {showArvField ? (
            <>
              {metrics?.ltc !== null && metrics?.ltc !== undefined ? (
                <p>
                  Loan-to-cost is <span className="font-semibold text-[#374151]">{formatPercent(metrics?.ltc)}</span>.
                </p>
              ) : null}
              {metrics?.ltarv !== null && metrics?.ltarv !== undefined ? (
                <p>
                  After-repair loan-to-value is{' '}
                  <span className="font-semibold text-[#374151]">{formatPercent(metrics?.ltarv)}</span>.
                </p>
              ) : null}
            </>
          ) : (
            <>
              {metrics?.aiv_ltv !== null && metrics?.aiv_ltv !== undefined ? (
                <p>
                  Loan-to-value is <span className="font-semibold text-[#374151]">{formatPercent(metrics?.aiv_ltv)}</span>.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-[28px] font-semibold leading-tight text-[#1f2937]">
        Total Loan Amount: {formatMoney(metrics?.total_loan)}
      </p>
      <p className="mt-1 text-xs text-[#6b7280]">
        {loading ? 'Rates are being calculated...' : 'Rates have been calculated'}
      </p>
    </section>
  );
}
