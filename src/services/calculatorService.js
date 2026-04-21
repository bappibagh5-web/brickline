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
const PERSONAL_GUARANTEE_RATE_ADJUSTMENT = 1.0;
const REFINANCE_SEASONING_RISK_ADJUSTMENT = 1.0;
const MAX_AIV_LTV = 0.75;
const MIN_REHAB_COST = 1000;

const FICO_TERM_RATE_OVERRIDES = {
  '700-719': {
    12: 9.5,
    18: 10.0,
    24: 10.5
  },
  '720-739': {
    12: 9.25,
    18: 9.75,
    24: 10.25
  },
  '740-759': {
    12: 8.95,
    18: 9.45,
    24: 9.95
  },
  '760-779': {
    12: 8.75,
    18: 9.25,
    24: 9.75
  },
  'Over 780': {
    12: 8.65,
    18: 9.15,
    24: 9.65
  }
};

const FICO_RATE_ORDER = [
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

const MIN_DISPLAY_LOAN = 40000;
const MIN_LOAN_AMOUNT = 100000;
const DSCR_MIN_LOAN_AMOUNT = 100000;
const DSCR_MAX_PURCHASE_LTV = 0.8;
const DSCR_MAX_REFINANCE_LTV = 0.75;

const DSCR_PRODUCTS = [
  { key: '5/1 Adjustable', amortized: true },
  { key: 'Interest-Only 5/1 Adjustable', amortized: false },
  { key: '7/1 Adjustable', amortized: true },
  { key: 'Interest-Only 7/1 Adjustable', amortized: false },
  { key: '30 Year Fixed', amortized: true },
  { key: 'Interest-Only 30 Year Fixed', amortized: false }
];

const DSCR_PREPAY_OPTIONS = ['3-year', '5-year', '7-year'];

const DSCR_PRODUCT_SPREADS = {
  '5/1 Adjustable': 0,
  'Interest-Only 5/1 Adjustable': 0.125,
  '7/1 Adjustable': 0,
  'Interest-Only 7/1 Adjustable': 0.125,
  '30 Year Fixed': 0.125,
  'Interest-Only 30 Year Fixed': 0.25
};

const DSCR_ANCHOR_BASE_RATES = {
  '660-699': { '3-year': 6.875, '5-year': 6.75, '7-year': 6.5 },
  '700-719': { '3-year': 6.625, '5-year': 6.5, '7-year': 6.375 },
  '720-759': { '3-year': 6.5, '5-year': 6.5, '7-year': 6.25 },
  '760+': { '3-year': 6.5, '5-year': 6.375, '7-year': 6.25 }
};

const DSCR_UI_BUCKET_TO_ANCHOR_BUCKET = {
  '660-679': '660-699',
  '680-699': '660-699',
  '700-719': '700-719',
  '720-739': '720-759',
  '740-759': '720-759',
  '760-779': '760+',
  'Over 780': '760+'
};

function buildDscrRateMatrix() {
  const matrix = {};
  Object.entries(DSCR_UI_BUCKET_TO_ANCHOR_BUCKET).forEach(([uiBucket, anchorBucket]) => {
    const anchorByPenalty = DSCR_ANCHOR_BASE_RATES[anchorBucket];
    matrix[uiBucket] = {};
    DSCR_PREPAY_OPTIONS.forEach((penalty) => {
      const anchorRate = toNumber(anchorByPenalty?.[penalty], 0);
      matrix[uiBucket][penalty] = {};
      DSCR_PRODUCTS.forEach((product) => {
        matrix[uiBucket][penalty][product.key] = Number((anchorRate + toNumber(DSCR_PRODUCT_SPREADS[product.key], 0)).toFixed(3));
      });
    });
  });
  return matrix;
}

const DSCR_RATE_MATRIX = buildDscrRateMatrix();

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

function getEstimatedPropertyValue(input) {
  return toNumber(input.estimated_property_value ?? input.purchase_price ?? 0, 0);
}

function getRehabCost(input) {
  const rehabEnabled = String(input.property_rehab ?? input.rehab_enabled ?? 'yes').toLowerCase() !== 'no';
  if (!rehabEnabled) return null;
  const raw = input.rehab_cost ?? input.rehab_budget;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function getArv(input) {
  return toNumber(input.arv ?? input.comp_value ?? 0, 0);
}

function isAffirmative(value) {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'yes' || String(value).toLowerCase() === 'true';
}

function getRawRatesForFico(fico, ltcDecimal, personalGuaranteeAdjustment, refinanceSeasoningAdjustment) {
  const overrideRates = FICO_TERM_RATE_OVERRIDES[fico];
  if (overrideRates) {
    return [12, 18, 24].map((term) => ({
      term,
      rate: Number((toNumber(overrideRates[term], 0) + personalGuaranteeAdjustment + refinanceSeasoningAdjustment).toFixed(3))
    }));
  }

  const bucket = FICO_PRICING_BUCKET_MAP[fico];
  if (!bucket) return [];

  const band = getLeverageBand(ltcDecimal);
  const base12 = BASE_RATE_12_MONTH[bucket]?.[band];
  if (!Number.isFinite(base12)) return [];

  return [12, 18, 24].map((term) => ({
    term,
    rate: Number((base12 + TERM_SPREADS[term] + personalGuaranteeAdjustment + refinanceSeasoningAdjustment).toFixed(3))
  }));
}

function applyMonotonicRateGuard(fico, currentRates, ltcDecimal, personalGuaranteeAdjustment, refinanceSeasoningAdjustment) {
  const currentIndex = FICO_RATE_ORDER.indexOf(fico);
  if (currentIndex <= 0) return currentRates;

  const priorFico = FICO_RATE_ORDER[currentIndex - 1];
  const priorRates = getRawRatesForFico(priorFico, ltcDecimal, personalGuaranteeAdjustment, refinanceSeasoningAdjustment);
  if (!priorRates.length) return currentRates;

  return currentRates.map((item) => {
    const prior = priorRates.find((priorItem) => priorItem.term === item.term);
    if (!prior) return item;

    if (item.rate > prior.rate) {
      console.error('[Calculator] Non-monotonic rate detected. Clamping to preserve credit-tier ordering.', {
        fico,
        priorFico,
        term: item.term,
        currentRate: item.rate,
        priorRate: prior.rate
      });
      return { ...item, rate: prior.rate };
    }

    return item;
  });
}

function getPricingOptions(input, loanAmount, ltcDecimal, isEligible) {
  if (!isEligible) return [];

  const fico = input.fico_bucket ?? input.est_fico ?? input.fico;
  const refinanceEnabled = isAffirmative(input.refinance);
  const ownedSixMonths = isAffirmative(input.owned_six_months ?? input.prop_owned_6_months);
  const personallyGuaranteedRaw = String(
    input.personally_guaranteed ?? input.personallyGuaranteed ?? 'Yes'
  ).trim();
  const personallyGuaranteedNormalized = personallyGuaranteedRaw.toLowerCase();
  const isNotPersonallyGuaranteed = ['no', 'false', '0'].includes(personallyGuaranteedNormalized);
  const personalGuaranteeAdjustment = isNotPersonallyGuaranteed ? PERSONAL_GUARANTEE_RATE_ADJUSTMENT : 0.0;
  const refinanceSeasoningAdjustment = refinanceEnabled && !ownedSixMonths
    ? REFINANCE_SEASONING_RISK_ADJUSTMENT
    : 0.0;

  const rawRates = getRawRatesForFico(
    fico,
    ltcDecimal,
    personalGuaranteeAdjustment,
    refinanceSeasoningAdjustment
  );
  if (!rawRates.length) return [];

  const guardedRates = applyMonotonicRateGuard(
    fico,
    rawRates,
    ltcDecimal,
    personalGuaranteeAdjustment,
    refinanceSeasoningAdjustment
  );

  return guardedRates.map(({ term, rate }) => {
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

  const purchasePrice = getEstimatedPropertyValue(input);
  const loanAmount = getLoanAmount(input);
  const rehabEnabled = String(input.property_rehab ?? input.rehab_enabled ?? 'yes').toLowerCase() !== 'no';
  const isRefinance = isAffirmative(input.refinance);
  const rehabCostRaw = getRehabCost(input);
  const hasValidRehabCost = !rehabEnabled || (rehabCostRaw !== null && rehabCostRaw >= MIN_REHAB_COST);
  const rehabCost = hasValidRehabCost && rehabCostRaw !== null ? rehabCostRaw : 0;
  const arv = rehabEnabled ? getArv(input) : 0;

  const purchaseLoanAmount = loanAmount;
  const totalLoan = purchaseLoanAmount + rehabCost;
  const totalCost = purchasePrice + rehabCost;
  const ltcDecimal = purchasePrice > 0 ? purchaseLoanAmount / purchasePrice : 0;
  const ltarvDecimal = rehabEnabled && arv > 0 ? totalLoan / arv : 0;
  const aivLtvDecimal = purchasePrice > 0 ? loanAmount / purchasePrice : 0;
  const spread = arv - totalLoan;

  let qualifiedMaxLoanDecimal = Math.max(0, purchasePrice * policy.maxLTC);
  if (rehabEnabled && arv > 0) {
    qualifiedMaxLoanDecimal = Math.max(
      0,
      Math.min(
        purchasePrice * policy.maxLTC,
        (arv * policy.maxLTARV) - rehabCost
      )
    );
  }
  if (isRefinance && !rehabEnabled) {
    qualifiedMaxLoanDecimal = Math.max(0, Math.min(qualifiedMaxLoanDecimal, purchasePrice * MAX_AIV_LTV));
  }

  const errors = [];

  if (isRefinance && !rehabEnabled && aivLtvDecimal > MAX_AIV_LTV) {
    errors.push(
      'Reduce Initial Loan Amount. As-Is Loan-To-Value (AIV LTV) exceeds 75%'
    );
  }

  if (rehabEnabled && !hasValidRehabCost) {
    errors.push('Minimum rehab cost is $1,000');
  }

  if (!(isRefinance && !rehabEnabled) && ltcDecimal > policy.maxLTC) {
    errors.push(
      `Reduce either Purchase Price or Initial Loan Amount. Loan-To-Cost (LTC) is ${roundPercent(ltcDecimal)}%, but must be no more than ${roundPercent(policy.maxLTC)}%`
    );
  }

  if (rehabEnabled && ltarvDecimal > policy.maxLTARV) {
    errors.push(
      `Either decrease Loan Amount Requested or increase the After Repair Value. After-Repair-Value Loan-to-Value (ARV LTV) is ${roundPercent(ltarvDecimal)}%, but must be no more than ${roundPercent(policy.maxLTARV)}%`
    );
  }

  if (rehabEnabled && (purchasePrice + rehabCost) > arv && arv > 0) {
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
    ltc: rehabEnabled ? (hasValidRehabCost ? roundPercent(ltcDecimal) : null) : null,
    ltarv: rehabEnabled ? (hasValidRehabCost ? roundPercent(ltarvDecimal) : null) : null,
    aiv_ltv: roundPercent(aivLtvDecimal),
    metric_mode: rehabEnabled ? 'rehab' : 'as_is',
    spread: roundMoney(spread),
    min_loan: roundMoney(MIN_DISPLAY_LOAN),
    max_loan: roundMoney(qualifiedMaxLoanDecimal),
    loan_products: loanProducts
  };
}

function normalizeDscrInputs(input) {
  const refinance = isAffirmative(input.refinance);
  const prepaymentPenaltyRaw = String(input.prepayment_penalty ?? input.prepaymentPenalty ?? '3-year').trim();
  const prepaymentPenalty = DSCR_PREPAY_OPTIONS.includes(prepaymentPenaltyRaw) ? prepaymentPenaltyRaw : '3-year';
  const ficoBucket = String(input.fico_bucket ?? input.ficoBucket ?? input.est_fico ?? '').trim();
  const loanAmount = toNumber(input.loan_amount ?? input.loanAmount ?? 0, 0);
  const purchasePrice = toNumber(input.purchase_price ?? input.purchasePrice ?? 0, 0);
  const estimatedPropertyValue = toNumber(input.estimated_property_value ?? input.estimatedPropertyValue ?? 0, 0);
  const remainingMortgage = toNumber(input.remaining_mortgage ?? input.remainingMortgage ?? 0, 0);
  const monthlyRent = toNumber(input.monthly_rent ?? input.monthlyRent ?? 0, 0);
  const annualInsurance = toNumber(input.annual_insurance ?? input.annualInsurance ?? 0, 0);
  const annualTaxes = toNumber(input.annual_taxes ?? input.annualTaxes ?? 0, 0);
  const monthlyHoa = toNumber(input.monthly_hoa ?? input.monthlyHOA ?? 0, 0);
  const propertyState = String(input.property_state ?? input.propertyState ?? '').trim().toUpperCase();
  const propertyType = String(input.property_type ?? input.propertyType ?? '').trim();

  return {
    refinance,
    ficoBucket,
    prepaymentPenalty,
    loanAmount,
    purchasePrice,
    estimatedPropertyValue,
    remainingMortgage,
    monthlyRent,
    annualInsurance,
    annualTaxes,
    monthlyHoa,
    propertyState,
    propertyType
  };
}

function getDscrLtvAdjustment(ltv, refinance) {
  if (ltv <= 0.6) return 0;
  if (ltv <= 0.7) return 0.125;
  if (ltv <= 0.75) return 0.25;
  if (!refinance && ltv <= 0.8) return 0.25;
  return null;
}

function calculateInterestOnlyPayment(loanAmount, annualRatePct) {
  return loanAmount * (annualRatePct / 100) / 12;
}

function calculateAmortizedPayment(loanAmount, annualRatePct, years = 30) {
  const monthlyRate = annualRatePct / 100 / 12;
  const months = years * 12;
  if (monthlyRate <= 0) return loanAmount / months;
  return loanAmount * ((monthlyRate * ((1 + monthlyRate) ** months)) / (((1 + monthlyRate) ** months) - 1));
}

function validateDscrEligibility(normalized) {
  const {
    refinance,
    loanAmount,
    purchasePrice,
    estimatedPropertyValue,
    ficoBucket,
    prepaymentPenalty
  } = normalized;
  const errors = [];

  if (!ficoBucket || !DSCR_RATE_MATRIX[ficoBucket]) {
    errors.push('Please select a valid FICO score bucket.');
  }

  if (!prepaymentPenalty || !DSCR_PREPAY_OPTIONS.includes(prepaymentPenalty)) {
    errors.push('Please select a valid prepayment penalty term.');
  }

  if (loanAmount < DSCR_MIN_LOAN_AMOUNT) {
    errors.push('Minimum loan amount is $100,000.');
  }

  if (refinance) {
    if (estimatedPropertyValue <= 0) {
      errors.push('Estimated Property Value is required for refinance.');
    }
  } else if (purchasePrice <= 0) {
    errors.push('Purchase Price is required for purchase loans.');
  }

  const denominator = refinance ? estimatedPropertyValue : purchasePrice;
  const ltv = denominator > 0 ? loanAmount / denominator : null;
  const maxLtv = refinance ? DSCR_MAX_REFINANCE_LTV : DSCR_MAX_PURCHASE_LTV;
  if (ltv !== null && ltv > maxLtv) {
    const maxLoanAllowed = denominator * maxLtv;
    errors.push(`Max allowed loan for this deal is ${formatCurrencyDollar(maxLoanAllowed)}.`);
  }

  return {
    errors,
    ltv,
    maxLtv
  };
}

function formatCurrencyDollar(value) {
  return `$${Math.round(toNumber(value, 0)).toLocaleString('en-US')}`;
}

function calculateDscrMetrics(input) {
  const normalized = normalizeDscrInputs(input);
  const {
    refinance,
    ficoBucket,
    prepaymentPenalty,
    loanAmount,
    purchasePrice,
    estimatedPropertyValue,
    remainingMortgage,
    monthlyRent,
    annualInsurance,
    annualTaxes,
    monthlyHoa
  } = normalized;

  const eligibility = validateDscrEligibility(normalized);
  const { ltv } = eligibility;
  const ltvAdjustment = ltv === null ? null : getDscrLtvAdjustment(ltv, refinance);
  const errors = [...eligibility.errors];

  const isEligible = errors.length === 0;
  const maxLoanAllowed = (refinance ? estimatedPropertyValue : purchasePrice) * (refinance ? DSCR_MAX_REFINANCE_LTV : DSCR_MAX_PURCHASE_LTV);
  const loanProducts = [];

  if (isEligible) {
    const matrixByPenalty = DSCR_RATE_MATRIX[ficoBucket]?.[prepaymentPenalty] || {};
    for (const product of DSCR_PRODUCTS) {
      const baseRate = toNumber(matrixByPenalty[product.key], 0);
      if (baseRate <= 0) continue;
      const finalRate = baseRate + toNumber(ltvAdjustment, 0);
      const monthlyPayment = product.amortized
        ? calculateAmortizedPayment(loanAmount, finalRate, 30)
        : calculateInterestOnlyPayment(loanAmount, finalRate);

      const monthlyInsurance = annualInsurance / 12;
      const monthlyTaxes = annualTaxes / 12;
      const dscr = monthlyRent > 0
        ? monthlyRent / (monthlyPayment + monthlyInsurance + monthlyTaxes + monthlyHoa)
        : null;

      loanProducts.push({
        term: product.key,
        rate: Number(finalRate.toFixed(3)),
        monthly_payment: roundMoney(monthlyPayment),
        dscr: dscr === null || !Number.isFinite(dscr) ? null : Number(dscr.toFixed(2)),
        dscr_minimum: dscr === null ? null : 1.0,
        dscr_status: dscr === null ? null : (dscr >= 1.0 ? 'Qualifies' : 'Does Not Qualify')
      });
    }
  }

  return {
    is_eligible: isEligible,
    errors,
    mode: refinance ? 'refinance' : 'purchase',
    ltv: ltv === null ? null : roundPercent(ltv),
    ltv_adjustment: ltvAdjustment === null ? null : Number(ltvAdjustment.toFixed(3)),
    loan_amount: roundMoney(loanAmount),
    min_loan: roundMoney(DSCR_MIN_LOAN_AMOUNT),
    max_loan: roundMoney(maxLoanAllowed > 0 ? maxLoanAllowed : 0),
    purchase_price: roundMoney(purchasePrice),
    estimated_property_value: roundMoney(estimatedPropertyValue),
    remaining_mortgage: roundMoney(remainingMortgage),
    prepayment_penalty: prepaymentPenalty,
    fico_bucket: ficoBucket,
    loan_products: loanProducts
  };
}

module.exports = {
  calculateLoanMetrics,
  calculateDscrMetrics
};
