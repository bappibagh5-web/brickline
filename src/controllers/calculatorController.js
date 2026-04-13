const { calculateLoanMetrics } = require('../services/calculatorService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function calculate(req, res, next) {
  try {
    const body = req.body || {};
    const propertyState = String(body.property_state ?? body.state ?? '').toUpperCase();
    const propertyType = String(body.property_type ?? body.propertyType ?? '').trim();

    if (propertyState === 'FL' && propertyType === 'Condo') {
      return res.status(400).json({
        error: 'unsupported_property_type',
        message: 'We do not currently finance this property type in Florida.'
      });
    }

    const requiredFields = [
      { name: 'purchase_price', aliases: ['purchase_price', 'estimated_property_value'] },
      { name: 'loan_amount', aliases: ['loan_amount', 'purchase_loan', 'purchase_loan_amount', 'refinance_loan'] },
    ];

    const missing = requiredFields
      .filter((field) => !field.aliases.some((alias) => body[alias] !== undefined && body[alias] !== null && body[alias] !== ''))
      .map((field) => field.name);

    if ((body.property_rehab ?? 'yes') !== 'no') {
      const hasArv = ['arv', 'comp_value'].some((alias) => body[alias] !== undefined && body[alias] !== null && body[alias] !== '');
      if (!hasArv) {
        missing.push('arv');
      }
      const hasRehabCost = ['rehab_cost', 'rehab_budget'].some((alias) => body[alias] !== undefined && body[alias] !== null && body[alias] !== '');
      if (!hasRehabCost) {
        missing.push('rehab_cost');
      }
      const rehabRaw = body.rehab_cost ?? body.rehab_budget;
      const rehabValue = Number(rehabRaw);
      if (Number.isFinite(rehabValue) && rehabValue < 1000) {
        throw createHttpError(400, 'Minimum rehab cost is $1,000');
      }
    }

    if (missing.length > 0) {
      throw createHttpError(400, `Missing required fields: ${missing.join(', ')}`);
    }

    const data = calculateLoanMetrics(body);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    if (!error.status) {
      error.status = 400;
    }
    next(error);
  }
}

module.exports = {
  calculate
};
