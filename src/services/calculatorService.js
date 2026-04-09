const ELIGIBILITY_POLICY = [
  { fico: 'Below 600', maxLTC: 0.8, maxLTARV: 0.7, ficoTooLow: true },
  { fico: '600-619', maxLTC: 0.85, maxLTARV: 0.7, ficoTooLow: false },
  { fico: '620-639', maxLTC: 0.8, maxLTARV: 0.7, ficoTooLow: true },
  { fico: '640-659', maxLTC: 0.8, maxLTARV: 0.7, ficoTooLow: false },
  { fico: '660-679', maxLTC: 0.85, maxLTARV: 0.7, ficoTooLow: false },
  { fico: '680-699', maxLTC: 0.85, maxLTARV: 0.7, ficoTooLow: false },
  { fico: '700-719', maxLTC: 0.9, maxLTARV: 0.75, ficoTooLow: false },
  { fico: '720-739', maxLTC: 0.9, maxLTARV: 0.75, ficoTooLow: false },
  { fico: '740-759', maxLTC: 0.9, maxLTARV: 0.75, ficoTooLow: false },
  { fico: '760-779', maxLTC: 0.9, maxLTARV: 0.75, ficoTooLow: false },
  { fico: 'Over 780', maxLTC: 0.9, maxLTARV: 0.75, ficoTooLow: false }
];

const FICO_PRICING_BUCKET_MAP = {
  '640-659': 'bucketA',
  '660-679': 'bucketB',
  '680-699': 'bucketB',
  '700-719': 'bucketC',
  '720-739': 'bucketC',
  '740-759': 'bucketC',
  '760-779': 'bucketD',
  'Over 780': 'bucketD'
};

const BASE_RATE_12_MONTH = {
  bucketA: { band1: 11.45, band2: 11.45, band3: 11.45 },
  bucketB: { band1: 9.5, band2: 10.5, band3: 11.5 },
  bucketC: { band1: 8.95, band2: 9.95, band3: 10.95 },
  bucketD: { band1: 8.75, band2: 9.5, band3: 10.5 }
};

const TERM_SPREADS = {
  12: 0,
  18: 0.75,
  24: 1
};
const REFI_OWNED_SIX_MONTHS_DISCOUNT = 0.25;
const PERSONAL_GUARANTEE_RATE_ADJUSTMENT = 1.0;

const MIN_DISPLAY_LOAN = 40000;
const MIN_LOAN_AMOUNT = 100000;

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundMoney(value) {
  return Number(toNumber(value, 0).toFixed(2));
}

function roundPercent(value) {
  return Number((toNumber(value, 0) * 100).toFixed(2));
}

function getPolicy(fico) {
  return ELIGIBILITY_POLICY.find((item) => item.fico === fico) || ELIGIBILITY_POLICY[0];
}

function getLeverageBand(ltcDecimal) {
  if (ltcDecimal <= 0.75) return 'band1';
  if (ltcDecimal < 0.8) return 'band2';
  return 'band3';
}

function getLoanAmount(input) {
  const isRefinance = isAffirmative(input.refinance);

  if (isRefinance) {
    return toNumber(
      input.refinance_loan_amount
      ?? input.refinance_loan
      ?? input.loan_amount
      ?? 0,
      0
    );
  }

  return toNumber(
    input.purchase_loan_amount
    ?? input.purchase_loan
    ?? input.loan_amount
    ?? 0,
    0
  );
}

function getRehabCost(input) {
  const rehabEnabled = String(input.property_rehab ?? input.rehab_enabled ?? 'yes').toLowerCase() !== 'no';
  if (!rehabEnabled) return 0;
  return toNumber(input.rehab_cost ?? input.rehab_budget ?? 0, 0);
}

function getArv(input) {
  return toNumber(input.arv ?? input.comp_value ?? 0, 0);
}

function isAffirmative(value) {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'yes' || String(value).toLowerCase() === 'true';
}

function getPricingOptions(input, loanAmount, ltcDecimal, isEligible) {
  if (!isEligible) return [];

  const fico = input.fico_bucket ?? input.est_fico ?? input.fico;
  const bucket = FICO_PRICING_BUCKET_MAP[fico];
  if (!bucket) return [];

  const band = getLeverageBand(ltcDecimal);
  let base12 = BASE_RATE_12_MONTH[bucket]?.[band];
  if (!Number.isFinite(base12)) return [];

  const refinanceEnabled = isAffirmative(input.refinance);
  const ownedSixMonths = isAffirmative(input.owned_six_months);
  const personallyGuaranteedRaw = String(
    input.personally_guaranteed ?? input.personallyGuaranteed ?? 'Yes'
  ).trim();
  console.log('PG:', personallyGuaranteedRaw);
  const personalGuaranteeAdjustment = personallyGuaranteedRaw === 'No'
    ? PERSONAL_GUARANTEE_RATE_ADJUSTMENT
    : 0.0;
  if (refinanceEnabled && ownedSixMonths) {
    base12 = Math.max(0, base12 - REFI_OWNED_SIX_MONTHS_DISCOUNT);
  }

  return [12, 18, 24].map((term) => {
    const rate = Number((base12 + TERM_SPREADS[term] + personalGuaranteeAdjustment).toFixed(3));
    const annualRateDecimal = rate / 100;
    const monthlyPayment = roundMoney((loanAmount * annualRateDecimal) / 12);
    return {
      term,
      rate,
      monthly_payment: monthlyPayment
    };
  });
}

function calculateLoanMetrics(input) {
  const fico = input.fico_bucket ?? input.est_fico ?? input.fico ?? 'Below 600';
  const policy = getPolicy(fico);

  const purchasePrice = toNumber(input.purchase_price, 0);
  const loanAmount = getLoanAmount(input);
  const rehabCost = getRehabCost(input);
  const arv = getArv(input);

  const purchaseLoanAmount = loanAmount;
  const totalLoan = purchaseLoanAmount + rehabCost;
  const totalCost = purchasePrice + rehabCost;
  const ltcDecimal = purchasePrice > 0 ? purchaseLoanAmount / purchasePrice : 0;
  const ltarvDecimal = arv > 0 ? totalLoan / arv : 0;
  const spread = arv - totalLoan;

  const qualifiedMaxLoanDecimal = Math.max(
    0,
    Math.min(
      purchasePrice * policy.maxLTC,
      (arv * policy.maxLTARV) - rehabCost
    )
  );

  const errors = [];

  if (ltarvDecimal > policy.maxLTARV) {
    errors.push(
      `Either decrease Loan Amount Requested or increase the After Repair Value. After-Repair-Value Loan-to-Value (ARV LTV) is ${roundPercent(ltarvDecimal)}%, but must be no more than ${roundPercent(policy.maxLTARV)}%`
    );
  }

  if (ltcDecimal > policy.maxLTC) {
    errors.push(
      `Reduce either Purchase Price or Initial Loan Amount. Loan-To-Cost (LTC) is ${roundPercent(ltcDecimal)}%, but must be no more than ${roundPercent(policy.maxLTC)}%`
    );
  }

  if ((purchasePrice + rehabCost) > arv && arv > 0) {
    errors.push('Adjust your Rehab Amount. Based on ARV and cost, the rehab cost is too high.');
  }

  if (policy.ficoTooLow) {
    errors.push("Applicant's FICO score is too low");
  }

  if (loanAmount < MIN_LOAN_AMOUNT) {
    errors.push('Minimum loan amount is $100,000');
  }

  const isEligible = errors.length === 0;
  const loanProducts = getPricingOptions(input, loanAmount, ltcDecimal, isEligible);

  return {
    fico_policy: policy.fico,
    property_type: input.property_type || input.propertyType || null,
    is_eligible: isEligible,
    errors,
    purchase_loan: roundMoney(purchaseLoanAmount),
    rehab_loan: roundMoney(rehabCost),
    total_loan: roundMoney(totalLoan),
    total_cost: roundMoney(totalCost),
    arv: roundMoney(arv),
    ltc: roundPercent(ltcDecimal),
    ltarv: roundPercent(ltarvDecimal),
    spread: roundMoney(spread),
    min_loan: roundMoney(MIN_DISPLAY_LOAN),
    max_loan: roundMoney(qualifiedMaxLoanDecimal),
    loan_products: loanProducts
  };
}

module.exports = {
  calculateLoanMetrics
};
