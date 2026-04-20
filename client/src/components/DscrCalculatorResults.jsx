function formatMoney(value, withCents = false) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  const digits = withCents ? 2 : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value));
}

function ResultSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-[72px] animate-pulse rounded border border-[#e5e7eb] bg-white" />
      <div className="h-[72px] animate-pulse rounded border border-[#e5e7eb] bg-white" />
      <div className="h-[72px] animate-pulse rounded border border-[#e5e7eb] bg-white" />
    </div>
  );
}

export default function DscrCalculatorResults({
  metrics,
  loading,
  savingProduct,
  onChooseProduct,
  externalErrors = []
}) {
  if (loading) {
    return <ResultSkeleton />;
  }

  const products = Array.isArray(metrics?.loan_products) ? metrics.loan_products : [];
  const errors = Array.from(
    new Set([
      ...(Array.isArray(externalErrors) ? externalErrors : []),
      ...(Array.isArray(metrics?.errors) ? metrics.errors : [])
    ].filter(Boolean))
  );
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

      <p className="mb-2 text-sm text-[#4b5563]">You qualified for the following loans.</p>

      {hasMetrics && !isEligible ? (
        <div className="rounded-md border border-[#e5e7eb] bg-white px-4 py-5">
          <p className="text-base font-semibold text-[#1f2937]">No Loans Available</p>
          <p className="mt-1 text-sm text-[#6b7280]">Adjust your information to see available products.</p>
        </div>
      ) : null}

      <div className="space-y-1">
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
                <div className="border-b border-[#d7efe8] bg-[#dff4ee] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0b5f56]">
                  Lowest Rate
                </div>
              ) : null}
              <div className="grid grid-cols-1 items-center gap-2 px-3 py-2.5 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
                <div>
                  <p className="text-xs text-[#6b7280]">Rate Type</p>
                  <p className="text-base font-semibold leading-tight text-[#1f2937]">{product.term}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Rate</p>
                  <p className="text-base font-semibold leading-tight text-[#1f2937]">{Number(product.rate).toFixed(3)}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Est. Monthly Payment</p>
                  <p className="text-base font-semibold leading-tight text-[#1f2937]">{formatMoney(product.monthly_payment, true)}</p>
                  {product.dscr !== null && product.dscr !== undefined ? (
                    <p className="mt-1 text-xs text-[#475569]">
                      DSCR {Number(product.dscr).toFixed(2)} (Min 1.00):{' '}
                      <span className={product.dscr >= 1 ? 'text-[#0f766e] font-semibold' : 'text-[#b91c1c] font-semibold'}>
                        {product.dscr_status}
                      </span>
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={savingProduct || loading || !onChooseProduct}
                  onClick={() => onChooseProduct?.(product)}
                  className="h-8 min-w-[78px] rounded-md bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-3 text-xs font-semibold text-white transition-all duration-150 hover:from-[#284de4] hover:to-[#1d40d8] disabled:cursor-not-allowed disabled:opacity-60"
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
