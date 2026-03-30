function formatMoney(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  const digits = options.cents ? 2 : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value));
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toFixed(2)}%`;
}

function ResultSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-4/5 animate-pulse rounded bg-[#eef2f7]" />
      <div className="h-[84px] animate-pulse rounded border border-[#e5e7eb] bg-white" />
      <div className="h-[84px] animate-pulse rounded border border-[#e5e7eb] bg-white" />
      <div className="h-[84px] animate-pulse rounded border border-[#e5e7eb] bg-white" />
    </div>
  );
}

export default function CalculatorResults({
  metrics,
  loading,
  savingProduct,
  onChooseProduct
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <ResultSkeleton />
      </div>
    );
  }

  const products = Array.isArray(metrics?.loan_products) ? metrics.loan_products : [];
  const errors = Array.isArray(metrics?.errors) ? metrics.errors : [];
  const hasMetrics = Boolean(metrics);
  const isEligible = Boolean(metrics?.is_eligible);
  const lowestRate = products.length > 0
    ? Math.min(...products.map((p) => Number(p.rate)))
    : null;

  return (
    <section className="mt-1">
      {errors.length > 0 ? (
        <div className="mb-3 rounded-md border border-[#ef4444] bg-[#fef2f2] px-4 py-3">
          <p className="text-sm font-semibold text-[#b91c1c]">Please fix the following</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#b91c1c]">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mb-2 text-base text-[#4b5563]">
        Based on your provided information, you've qualified for the following options:
      </p>
      {hasMetrics && !isEligible ? (
        <div className="rounded-md border border-[#e5e7eb] bg-white px-4 py-5">
          <p className="text-base font-semibold text-[#1f2937]">No Loans Available</p>
          <p className="mt-1 text-sm text-[#6b7280]">Adjust your information to see more.</p>
        </div>
      ) : null}
      <div className="space-y-1.5">
        {products.map((product) => {
          const isLowestRate = Number(product.rate) === lowestRate;
          return (
            <div
              key={product.term}
              className={`border border-[#e5e7eb] bg-white ${
                isLowestRate ? 'bg-[#e9f8f3]' : ''
              }`}
            >
              {isLowestRate ? (
                <div className="border-b border-[#d7efe8] bg-[#dff4ee] px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0b5f56]">
                  Lowest Rate
                </div>
              ) : null}
              <div className="grid grid-cols-1 items-center gap-3 px-4 py-3.5 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div>
                  <p className="text-xs text-[#6b7280]">Rate Type</p>
                  <p className="text-[18px] font-semibold leading-tight text-[#1f2937]">{product.term} Months</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Rate</p>
                  <p className="text-[18px] font-semibold leading-tight text-[#1f2937]">{Number(product.rate).toFixed(3)}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Est. Monthly Payment</p>
                  <p className="text-[18px] font-semibold leading-tight text-[#1f2937]">{formatMoney(product.monthly_payment, { cents: true })}</p>
                </div>
                <button
                  type="button"
                  disabled={savingProduct || loading || !onChooseProduct}
                  onClick={() => onChooseProduct?.(product)}
                  className="h-9 min-w-[86px] rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0c655e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProduct ? 'Saving...' : 'Choose'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
