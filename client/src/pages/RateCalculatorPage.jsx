import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { calculateLoan, getApplication, saveApplicationStep } from '../api/lendingApi.js';
import CalculatorForm from '../components/CalculatorForm.jsx';
import CalculatorResults from '../components/CalculatorResults.jsx';
import FunnelHeader from '../components/FunnelHeader.jsx';
import { getStoredApplicationId, setStoredApplicationId } from '../funnel/session.js';
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
    refinance: 'no',
    owned_six_months: 'yes',
    property_rehab: 'yes',
    purchase_price: '$200,000',
    purchase_loan_amount: '$150,000',
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
        const result = await calculateLoan(apiBaseUrl, {
          fico_bucket: form.est_fico,
          est_fico: form.est_fico,
          property_type: form.property_type,
          propertyType: form.property_type,
          refinance: form.refinance,
          owned_six_months: form.owned_six_months,
          property_rehab: form.property_rehab,
          purchase_price: parseCurrencyInput(form.purchase_price),
          loan_amount: parseCurrencyInput(form.purchase_loan_amount),
          rehab_cost: form.property_rehab === 'yes' ? parseCurrencyInput(form.rehab_budget) : 0,
          arv: parseCurrencyInput(form.comp_value)
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
    form.rehab_budget,
    form.comp_value,
    form.property_type,
    form.refinance,
    form.owned_six_months,
    form.est_fico,
    form.property_rehab
  ]);

  const handleFormChange = (field, value) => {
    const isCurrencyField = ['purchase_price', 'purchase_loan_amount', 'rehab_budget', 'comp_value'].includes(field);
    const nextValue = isCurrencyField ? formatCurrencyInput(value) : value;

    setForm((prev) => ({
      ...prev,
      ...(field === 'property_rehab' && value === 'no'
        ? { rehab_budget: '$0' }
        : {}),
      [field]: nextValue
    }));
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
      const purchasePrice = parseCurrencyInput(form.purchase_price);
      const purchaseLoanAmount = parseCurrencyInput(form.purchase_loan_amount);
      const rehabBudget = parseCurrencyInput(form.rehab_budget);
      const compValue = parseCurrencyInput(form.comp_value);

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'selected_loan_product', {
        term: product.term,
        rate: product.rate,
        monthly_payment: product.monthly_payment,
        total_loan: Number(metrics?.total_loan || 0),
        purchase_loan: purchaseLoanAmount || Number(metrics?.purchase_loan || 0),
        rehab_loan: Number(metrics?.rehab_loan || 0)
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_inputs', {
        property_state: form.property_state,
        property_type: form.property_type,
        propertyType: form.property_type,
        est_fico: form.est_fico,
        refinance: form.refinance,
        owned_six_months: form.owned_six_months,
        property_rehab: form.property_rehab,
        purchase_price: purchasePrice,
        loan_amount: purchaseLoanAmount,
        purchase_loan: purchaseLoanAmount,
        rehab_cost: rehabBudget,
        rehab_budget: rehabBudget,
        arv: compValue,
        comp_value: compValue
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_results', {
        ...(metrics || {}),
        property_type: form.property_type,
        purchase_price: purchasePrice,
        purchase_loan: purchaseLoanAmount || Number(metrics?.purchase_loan || 0),
        rehab_budget: rehabBudget,
        comp_value: compValue
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
