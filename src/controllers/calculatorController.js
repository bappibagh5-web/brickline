const { calculateLoanMetrics } = require('../services/calculatorService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function calculate(req, res, next) {
  try {
    const body = req.body || {};

    const requiredFields = [
      { name: 'purchase_price', aliases: ['purchase_price'] },
      { name: 'loan_amount', aliases: ['loan_amount', 'purchase_loan', 'purchase_loan_amount', 'refinance_loan'] },
      { name: 'arv', aliases: ['arv', 'comp_value'] }
    ];

    const missing = requiredFields
      .filter((field) => !field.aliases.some((alias) => body[alias] !== undefined && body[alias] !== null && body[alias] !== ''))
      .map((field) => field.name);

    if ((body.property_rehab ?? 'yes') !== 'no') {
      const hasRehabCost = ['rehab_cost', 'rehab_budget'].some((alias) => body[alias] !== undefined && body[alias] !== null && body[alias] !== '');
      if (!hasRehabCost) {
        missing.push('rehab_cost');
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
