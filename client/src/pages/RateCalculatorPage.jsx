import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { calculateLoan, getApplication, saveApplicationStep } from '../api/lendingApi.js';
import CalculatorForm from '../components/CalculatorForm.jsx';
import CalculatorResults from '../components/CalculatorResults.jsx';
import FunnelHeader from '../components/FunnelHeader.jsx';
import {
  getStoredApplicationId,
  setStoredApplicationId,
  setStoredSelectedLoan
} from '../funnel/session.js';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';

function formatCurrencyInput(value) {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(numeric);
}

function parseCurrencyInput(value) {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function RateCalculatorPage() {
  const apiBaseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [searchParams] = useSearchParams();
  const effectiveApplicationId = applicationId || searchParams.get('applicationId') || getStoredApplicationId() || '';
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [form, setForm] = useState({
    property_state: 'FL',
    property_type: '',
    est_fico: '700-719',
    personally_guaranteed: 'Yes',
    refinance: 'no',
    owned_six_months: 'yes',
    property_rehab: 'yes',
    purchase_price: '$200,000',
    purchase_loan_amount: '$150,000',
    refinance_loan_amount: '$150,000',
    remaining_mortgage: '$0',
    rehab_budget: '$75,000',
    comp_value: '$350,000'
  });

  useEffect(() => {
    if (!effectiveApplicationId) return;
    setStoredApplicationId(effectiveApplicationId);

    let ignore = false;
    const loadApplication = async () => {
      setPageLoading(true);
      try {
        const application = await getApplication(apiBaseUrl, effectiveApplicationId);
        if (ignore) return;
        const data = application?.application_data || {};
        const personallyGuaranteed = String(
          data.personally_guaranteed
          || data.personallyGuaranteed
          || data.calculator_inputs?.personally_guaranteed
          || 'Yes'
        ).toLowerCase() === 'no' ? 'No' : 'Yes';
        setForm((prev) => ({
          ...prev,
          property_state:
            data.property_state ||
            data.state ||
            data.lead_property_state ||
            data.purchase_property_state ||
            prev.property_state,
          property_type:
            data.property_type ||
            data.calculator_inputs?.property_type ||
            prev.property_type,
          est_fico: data.est_fico || prev.est_fico,
          personally_guaranteed: personallyGuaranteed,
          refinance: data.refinance || prev.refinance,
          owned_six_months: data.owned_six_months || prev.owned_six_months,
          property_rehab: data.property_rehab || prev.property_rehab,
          purchase_price:
            data.purchase_price !== undefined
              ? formatCurrencyInput(data.purchase_price)
              : prev.purchase_price,
          purchase_loan_amount:
            (data.loan_amount !== undefined || data.purchase_loan !== undefined)
              ? formatCurrencyInput(data.loan_amount ?? data.purchase_loan)
              : prev.purchase_loan_amount,
          refinance_loan_amount:
            (data.refinance_loan_amount !== undefined || data.refinance_loan !== undefined || (data.refinance === 'yes' && data.loan_amount !== undefined))
              ? formatCurrencyInput(data.refinance_loan_amount ?? data.refinance_loan ?? data.loan_amount)
              : prev.refinance_loan_amount,
          remaining_mortgage:
            data.remaining_mortgage !== undefined
              ? formatCurrencyInput(data.remaining_mortgage)
              : prev.remaining_mortgage,
          rehab_budget:
            (data.rehab_cost !== undefined || data.rehab_budget !== undefined)
              ? formatCurrencyInput(data.rehab_cost ?? data.rehab_budget)
              : prev.rehab_budget,
          comp_value:
            (data.arv !== undefined || data.comp_value !== undefined)
              ? formatCurrencyInput(data.arv ?? data.comp_value)
              : prev.comp_value,
        }));
      } catch (_loadError) {
        if (!ignore) {
          setError('Could not load application data.');
        }
      } finally {
        if (!ignore) {
          setPageLoading(false);
        }
      }
    };

    loadApplication();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, effectiveApplicationId]);

  useEffect(() => {
    if (form.purchase_price === '' || form.purchase_price === null || form.purchase_price === undefined) {
      setMetrics(null);
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const requiresRemainingMortgage = form.refinance === 'yes' && form.owned_six_months === 'yes';
        const remainingMortgageInput = String(form.remaining_mortgage || '').trim();
        const remainingMortgageAmount = parseCurrencyInput(form.remaining_mortgage);

        if (requiresRemainingMortgage && (!remainingMortgageInput || remainingMortgageAmount <= 0)) {
          if (!ignore) {
            setMetrics(null);
            setError('Please enter remaining mortgage balance to continue');
            setLoading(false);
          }
          return;
        }

        const purchaseLoanAmount = parseCurrencyInput(form.purchase_loan_amount);
        const refinanceLoanAmount = parseCurrencyInput(form.refinance_loan_amount);
        const effectiveLoanAmount = form.refinance === 'yes' ? refinanceLoanAmount : purchaseLoanAmount;
        const personallyGuaranteedValue = String(form.personally_guaranteed || '').trim();

        if (!personallyGuaranteedValue) {
          if (!ignore) {
            setMetrics(null);
            setError('Please select personally guaranteed to continue');
            setLoading(false);
          }
          return;
        }

        const result = await calculateLoan(apiBaseUrl, {
          fico_bucket: form.est_fico,
          est_fico: form.est_fico,
          personally_guaranteed: personallyGuaranteedValue,
          property_type: form.property_type,
          propertyType: form.property_type,
          refinance: form.refinance,
          owned_six_months: form.owned_six_months,
          prop_owned_6_months: form.owned_six_months,
          property_rehab: form.property_rehab,
          estimated_property_value: parseCurrencyInput(form.purchase_price),
          purchase_price: parseCurrencyInput(form.purchase_price),
          loan_amount: effectiveLoanAmount,
          purchase_loan_amount: purchaseLoanAmount,
          refinance_loan_amount: refinanceLoanAmount,
          remaining_mortgage: requiresRemainingMortgage
            ? remainingMortgageAmount
            : 0,
          rehab_cost: form.property_rehab === 'yes' ? parseCurrencyInput(form.rehab_budget) : 0,
          arv: form.property_rehab === 'yes' ? parseCurrencyInput(form.comp_value) : 0
        });
        if (!ignore) {
          setMetrics(result);
        }
      } catch (calcError) {
        if (!ignore) {
          setError(calcError.message || 'Calculator failed.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    apiBaseUrl,
    form.purchase_price,
    form.purchase_loan_amount,
    form.refinance_loan_amount,
    form.remaining_mortgage,
    form.rehab_budget,
    form.comp_value,
    form.property_type,
    form.refinance,
    form.owned_six_months,
    form.est_fico,
    form.personally_guaranteed,
    form.property_rehab
  ]);

  const handleFormChange = (field, value) => {
    const isCurrencyField = [
      'purchase_price',
      'purchase_loan_amount',
      'refinance_loan_amount',
      'remaining_mortgage',
      'rehab_budget',
      'comp_value'
    ].includes(field);
    const nextValue = isCurrencyField ? formatCurrencyInput(value) : value;

    setForm((prev) => {
      const next = {
        ...prev,
        ...(field === 'property_rehab' && value === 'no'
          ? { rehab_budget: '$0', comp_value: '$0' }
          : {}),
        [field]: nextValue
      };

      if (field === 'refinance' && value === 'no') {
        next.refinance_loan_amount = '';
        next.remaining_mortgage = '';
      }

      if (field === 'refinance' && value === 'yes' && !next.refinance_loan_amount) {
        next.refinance_loan_amount = prev.purchase_loan_amount || '$0';
      }

      if (field === 'owned_six_months' && value === 'no') {
        next.remaining_mortgage = '';
      }

      return next;
    });
  };

  const handleChooseProduct = async (product) => {
    if (!effectiveApplicationId || !product || loading || savingProduct) return;
    if (!String(form.property_type || '').trim()) {
      setError('Property Type is required.');
      return;
    }

    setSavingProduct(true);
    setError('');
    try {
      const selectedLoan = {
        term: product.term,
        rate: product.rate,
        monthlyPayment: product.monthly_payment,
        monthly_payment: product.monthly_payment
      };
      setStoredSelectedLoan(selectedLoan);
      console.log('Selected Loan:', selectedLoan);

      const purchasePrice = parseCurrencyInput(form.purchase_price);
      const purchaseLoanAmount = parseCurrencyInput(form.purchase_loan_amount);
      const refinanceLoanAmount = parseCurrencyInput(form.refinance_loan_amount);
      const remainingMortgage = parseCurrencyInput(form.remaining_mortgage);
      const effectiveLoanAmount = form.refinance === 'yes' ? refinanceLoanAmount : purchaseLoanAmount;
      const rehabBudget = parseCurrencyInput(form.rehab_budget);
      const compValue = parseCurrencyInput(form.comp_value);

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'selected_loan_product', {
        term: product.term,
        rate: product.rate,
        monthly_payment: product.monthly_payment,
        monthlyPayment: product.monthly_payment,
        total_loan: Number(metrics?.total_loan || 0),
        purchase_loan: effectiveLoanAmount || Number(metrics?.purchase_loan || 0),
        rehab_loan: Number(metrics?.rehab_loan || 0)
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'selectedLoan', {
        term: product.term,
        rate: product.rate,
        monthlyPayment: product.monthly_payment
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_inputs', {
        property_state: form.property_state,
        property_type: form.property_type,
        propertyType: form.property_type,
        est_fico: form.est_fico,
        personally_guaranteed: form.personally_guaranteed,
        refinance: form.refinance,
        owned_six_months: form.owned_six_months,
        prop_owned_6_months: form.owned_six_months,
        property_rehab: form.property_rehab,
        estimated_property_value: purchasePrice,
        purchase_price: purchasePrice,
        loan_amount: effectiveLoanAmount,
        purchase_loan: purchaseLoanAmount,
        purchase_loan_amount: purchaseLoanAmount,
        refinance_loan: refinanceLoanAmount,
        refinance_loan_amount: refinanceLoanAmount,
        remaining_mortgage: form.refinance === 'yes' && form.owned_six_months === 'yes' ? remainingMortgage : 0,
        rehab_cost: rehabBudget,
        rehab_budget: rehabBudget,
        arv: form.property_rehab === 'yes' ? compValue : 0,
        comp_value: form.property_rehab === 'yes' ? compValue : 0
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_results', {
        ...(metrics || {}),
        property_type: form.property_type,
        personally_guaranteed: form.personally_guaranteed,
        purchase_price: purchasePrice,
        estimated_property_value: purchasePrice,
        purchase_loan: effectiveLoanAmount || Number(metrics?.purchase_loan || 0),
        purchase_loan_amount: purchaseLoanAmount,
        refinance_loan_amount: refinanceLoanAmount,
        prop_owned_6_months: form.owned_six_months,
        remaining_mortgage: form.refinance === 'yes' && form.owned_six_months === 'yes' ? remainingMortgage : 0,
        rehab_budget: rehabBudget,
        comp_value: form.property_rehab === 'yes' ? compValue : 0,
        arv: form.property_rehab === 'yes' ? compValue : 0
      });

      navigate(`/m/standardBorrower/eligibility?applicationId=${effectiveApplicationId}`);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save selected loan product.');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <FunnelHeader />
      <div className="mx-auto w-full max-w-[920px] space-y-4 px-4 py-8 md:py-12">
        <header>
          <h1 className="section-title">Estimate Your Bridge Rate</h1>
        </header>

        {error ? <p className="text-sm font-medium text-[#b63d3d]">{error}</p> : null}
        {pageLoading ? <p className="text-sm text-[#60709a]">Loading application...</p> : null}

        <div className="space-y-4">
          <CalculatorForm
            form={form}
            onFormChange={handleFormChange}
            metrics={metrics}
            loading={loading}
          />
          <CalculatorResults
            metrics={metrics}
            loading={loading}
            savingProduct={savingProduct}
            disableChoose={!String(form.property_type || '').trim()}
            onChooseProduct={handleChooseProduct}
          />
        </div>
      </div>
    </div>
  );
}
