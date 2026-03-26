import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { calculateLoan, getApplication, saveApplicationStep } from '../api/lendingApi.js';
import CalculatorForm from '../components/CalculatorForm.jsx';
import CalculatorResults from '../components/CalculatorResults.jsx';
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

function toPercentDisplay(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return numeric > 0 && numeric <= 1 ? String(numeric * 100) : String(numeric);
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
    property_state: '',
    est_fico: '700-739',
    refinance: 'no',
    property_rehab: 'yes',
    purchase_price: '$60,000',
    rehab_budget: '$60,000',
    purchase_advance_percent: '75',
    rehab_advance_percent: '100',
    comp_value: '$250,000',
    rehab_factor: '0.6'
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
          est_fico: data.est_fico || prev.est_fico,
          refinance: data.refinance || prev.refinance,
          property_rehab: data.property_rehab || prev.property_rehab,
          purchase_price:
            data.purchase_price !== undefined
              ? formatCurrencyInput(data.purchase_price)
              : prev.purchase_price,
          rehab_budget:
            data.rehab_budget !== undefined
              ? formatCurrencyInput(data.rehab_budget)
              : prev.rehab_budget,
          purchase_advance_percent: data.purchase_advance_percent !== undefined
            ? toPercentDisplay(data.purchase_advance_percent)
            : prev.purchase_advance_percent,
          rehab_advance_percent: data.rehab_advance_percent !== undefined
            ? toPercentDisplay(data.rehab_advance_percent)
            : prev.rehab_advance_percent,
          comp_value:
            data.comp_value !== undefined
              ? formatCurrencyInput(data.comp_value)
              : prev.comp_value,
          rehab_factor: data.rehab_factor ?? prev.rehab_factor
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
          purchase_price: parseCurrencyInput(form.purchase_price),
          rehab_budget: parseCurrencyInput(form.rehab_budget),
          current_value: parseCurrencyInput(form.purchase_price),
          comp_value: parseCurrencyInput(form.comp_value),
          purchase_advance_percent: Number(form.purchase_advance_percent || 0),
          rehab_advance_percent: form.property_rehab === 'yes' ? Number(form.rehab_advance_percent || 0) : 0,
          rehab_factor: Number(form.rehab_factor || 0)
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
    form.rehab_budget,
    form.comp_value,
    form.purchase_advance_percent,
    form.rehab_advance_percent,
    form.rehab_factor,
    form.property_rehab
  ]);

  const handleFormChange = (field, value) => {
    const isCurrencyField = ['purchase_price', 'rehab_budget', 'comp_value'].includes(field);
    const nextValue = isCurrencyField ? formatCurrencyInput(value) : value;

    setForm((prev) => ({
      ...prev,
      ...(field === 'property_rehab' && value === 'no'
        ? { rehab_advance_percent: '0', rehab_budget: '$0' }
        : {}),
      [field]: nextValue
    }));
  };

  const handleChooseProduct = async (product) => {
    if (!effectiveApplicationId || !product || loading || savingProduct) return;

    setSavingProduct(true);
    setError('');
    try {
      const purchasePrice = parseCurrencyInput(form.purchase_price);
      const rehabBudget = parseCurrencyInput(form.rehab_budget);
      const compValue = parseCurrencyInput(form.comp_value);
      const purchaseAdvancePercent = Number(form.purchase_advance_percent || 0);
      const rehabAdvancePercent = form.property_rehab === 'yes' ? Number(form.rehab_advance_percent || 0) : 0;

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'selected_loan_product', {
        term: product.term,
        rate: product.rate,
        monthly_payment: product.monthly_payment,
        total_loan: Number(metrics?.total_loan || 0),
        purchase_loan: Number(metrics?.purchase_loan || 0),
        rehab_loan: Number(metrics?.rehab_loan || 0)
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_inputs', {
        property_state: form.property_state,
        est_fico: form.est_fico,
        refinance: form.refinance,
        property_rehab: form.property_rehab,
        purchase_price: purchasePrice,
        rehab_budget: rehabBudget,
        comp_value: compValue,
        purchase_advance_percent: purchaseAdvancePercent,
        rehab_advance_percent: rehabAdvancePercent,
        rehab_factor: Number(form.rehab_factor || 0)
      });

      await saveApplicationStep(apiBaseUrl, effectiveApplicationId, 'calculator_results', {
        ...(metrics || {}),
        purchase_price: purchasePrice,
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
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 md:py-12">
      <header className="mb-8 flex h-12 items-center justify-between border-b border-[#d6d9db] bg-white px-5">
        <p className="text-lg font-bold tracking-tight text-[#2f54eb]">Brickline</p>
        <p className="text-xs text-[#4b5563]">Questions? 1-844-415-4663</p>
      </header>
      <div className="mx-auto w-full max-w-[920px] space-y-4">
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
            onChooseProduct={handleChooseProduct}
          />
        </div>
      </div>
    </div>
  );
}
