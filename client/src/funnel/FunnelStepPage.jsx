import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';
import { funnelConfig, funnelInitialStepId } from './config.js';
import { useFunnel } from './FunnelContext.jsx';
import { getNextRoute, getStepByRoute } from './utils.js';
import {
  getStoredApplicationId,
  setStoredApplicationId,
  setStoredFunnelEmail
} from './session.js';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY'
];

function getStepValue(step, answers) {
  if (step.type === 'name') {
    return {
      first_name: answers.first_name || '',
      last_name: answers.last_name || ''
    };
  }

  if (!step.key) return null;
  return answers[step.key] ?? '';
}

function StepRenderer({ step, value, setValue }) {
  if (step.options) {
    return (
      <div className="mt-6 grid gap-2.5">
        {step.options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(option.value)}
              className={`h-11 rounded-none border px-4 text-left text-[14px] font-normal transition-all duration-150 ${
                selected
                  ? 'border-[#4e6bf0] bg-[#eef2ff] text-[#1f3aa0]'
                  : 'border-[#9aa4ae] bg-[#f4f5f5] text-[#475569] hover:border-[#4e6bf0] hover:bg-[#f3f6ff]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (step.type === 'select') {
    return (
      <div className="mt-6">
        <select
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        >
          <option value="">Select a state</option>
          {US_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (step.type === 'input') {
    const inputPlaceholder = step.key === 'email' ? 'Enter Your Email Address' : 'Type your answer';
    return (
      <div className="mt-6">
        <input
          type={step.inputType || 'text'}
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          placeholder={inputPlaceholder}
        />
      </div>
    );
  }

  if (step.type === 'name') {
    return (
      <div className="mt-6 grid gap-2.5">
        <input
          type="text"
          value={value?.first_name || ''}
          onChange={(event) => setValue({ ...value, first_name: event.target.value })}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          placeholder="First name"
        />
        <input
          type="text"
          value={value?.last_name || ''}
          onChange={(event) => setValue({ ...value, last_name: event.target.value })}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          placeholder="Last name"
        />
      </div>
    );
  }

  return null;
}

export default function FunnelStepPage() {
  const apiBaseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { answers, setAnswer } = useFunnel();
  const { user } = useAuth();
  const [applicationId, setApplicationId] = useState(
    () => searchParams.get('applicationId') || getStoredApplicationId() || ''
  );
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [checkEmailSaved, setCheckEmailSaved] = useState(false);

  const current = getStepByRoute(location.pathname);

  if (!current) {
    return <Navigate to={funnelConfig[funnelInitialStepId].route} replace />;
  }

  const { stepId, step } = current;
  const value = getStepValue(step, answers);
  const isEmailCapture = stepId === 'emailCapture';

  const canProceed = (() => {
    if (step.type === 'name') {
      const firstName = String(value?.first_name || '').trim();
      const lastName = String(value?.last_name || '').trim();
      return Boolean(firstName && lastName);
    }

    if (!step.key) {
      return Boolean(step.next);
    }

    return Boolean(String(value || '').trim());
  })();

  useEffect(() => {
    let ignore = false;

    const syncApplicationSession = async () => {
      try {
        const fromUrl = searchParams.get('applicationId');
        const fromStorage = getStoredApplicationId();
        const existingApplicationId = fromUrl || fromStorage;

        if (existingApplicationId) {
          if (ignore) return;
          setApplicationId(existingApplicationId);
          setStoredApplicationId(existingApplicationId);

          if (!fromUrl) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('applicationId', existingApplicationId);
            setSearchParams(nextParams, { replace: true });
          }
          return;
        }

        const response = await fetch(`${apiBaseUrl}/applications/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to start application.');
        }

        const newApplicationId = payload.application_id;
        if (!newApplicationId) {
          throw new Error('Server did not return application_id.');
        }

        if (ignore) return;

        setApplicationId(newApplicationId);
        setStoredApplicationId(newApplicationId);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('applicationId', newApplicationId);
        setSearchParams(nextParams, { replace: true });
      } catch (syncError) {
        if (ignore) return;
        setError(syncError.message);
      } finally {
        if (!ignore) {
          setInitializing(false);
        }
      }
    };

    syncApplicationSession();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, searchParams, setSearchParams]);

  useEffect(() => {
    if (stepId !== 'accountCreationFlow' && checkEmailSaved) {
      setCheckEmailSaved(false);
      return;
    }

    if (stepId !== 'accountCreationFlow' || !applicationId || checkEmailSaved) {
      return;
    }

    let ignore = false;
    const persistCheckEmailStep = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_key: stepId,
            data: { check_email_viewed: true }
          })
        });

        if (!response.ok || ignore) return;
        setCheckEmailSaved(true);
      } catch (_error) {
        // Keep flow resilient even if this persistence call fails.
      }
    };

    persistCheckEmailStep();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, applicationId, checkEmailSaved, stepId]);

  const setStepValue = (nextValue) => {
    if (step.type === 'name') {
      const firstName = String(nextValue?.first_name || '');
      const lastName = String(nextValue?.last_name || '');
      const fullName = `${firstName} ${lastName}`.trim();

      setAnswer('first_name', firstName);
      setAnswer('last_name', lastName);
      setAnswer('name', fullName);
      return;
    }

    if (!step.key) return;
    setAnswer(step.key, nextValue);
  };

  const getStepPayload = () => {
    if (step.type === 'name') {
      const firstName = String(value?.first_name || '').trim();
      const lastName = String(value?.last_name || '').trim();
      return {
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim()
      };
    }

    if (!step.key) {
      return null;
    }

    return {
      [step.key]: value
    };
  };

  const handleNext = async () => {
    if (!canProceed) return;

    setError('');
    setSaving(true);

    try {
      const payloadData = getStepPayload();
      const shouldSaveStep = Boolean(payloadData && applicationId);

      if (isEmailCapture && typeof value === 'string') {
        setStoredFunnelEmail(value);
      }

      if (shouldSaveStep) {
        if (stepId === 'fullName' && user?.id) {
          await fetch(`${apiBaseUrl}/applications/${applicationId}/attach-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: user.id
            })
          }).catch(() => null);
        }

        const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_key: stepId,
            data: payloadData
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(payload?.error || 'Failed to save step.');
          return;
        }
      }

      const nextRoute = getNextRoute(stepId, value, answers, {
        isAuthenticated: Boolean(user)
      });
      if (!nextRoute) return;

      if (applicationId) {
        navigate(`${nextRoute}?applicationId=${applicationId}`);
        return;
      }
      navigate(nextRoute);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEmail = () => {
    window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
  };

  const handleBack = () => {
    if (stepId === funnelInitialStepId) return;
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f4] text-[#1f2937]">
      <header className="flex h-12 items-center justify-between border-b border-[#d6d9db] bg-white px-5">
        <p className="text-lg font-bold tracking-tight text-[#2f54eb]">Brickline</p>
        <p className="text-xs text-[#4b5563]">Questions? 1-844-415-4663</p>
      </header>

      <main className="grid min-h-[calc(100vh-48px-72px)] grid-cols-1 lg:grid-cols-12">
        <section className="px-5 py-10 lg:col-span-7 lg:px-16 xl:px-20">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepId === funnelInitialStepId}
            className="mb-5 inline-flex items-center gap-1 rounded px-1 py-1 text-xs font-medium text-[#4e5c86] transition-all duration-150 hover:text-[#2f54eb] disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="max-w-[520px]">
            <h1 className="text-[48px] text-[clamp(32px,3.2vw,48px)] font-normal leading-[1.1] tracking-[-0.02em] text-[#1f2937]">{step.title || 'Continue'}</h1>
            {step.description ? <p className="mt-2 text-sm text-[#60709a]">{step.description}</p> : null}
            {error ? <p className="mt-3 text-sm font-semibold text-[#b63d3d]">{error}</p> : null}
            {initializing ? <p className="mt-3 text-xs text-[#60709a]">Starting application session...</p> : null}

            <StepRenderer
              step={step}
              value={value}
              setValue={setStepValue}
            />

            {stepId === 'accountCreationFlow' ? (
              <button
                type="button"
                onClick={handleOpenEmail}
                className="mt-6 inline-flex h-10 min-w-[140px] items-center justify-center rounded bg-[#2f54eb] px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2246d0]"
              >
                Open your email
              </button>
            ) : step.next ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed || initializing || saving}
                className="mt-6 ml-auto inline-flex h-10 min-w-[88px] items-center justify-center rounded bg-[#2f54eb] px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2246d0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Next'}
              </button>
            ) : (
              <div className="mt-6 max-w-[460px] rounded-md border border-[#cfd8ff] bg-[#eef2ff] p-3 text-center text-sm font-semibold text-[#1f3aa0]">
                Funnel complete
              </div>
            )}
          </div>
        </section>

        <aside className="relative hidden overflow-hidden border-l border-[#d6d9db] bg-white lg:col-span-5 lg:block">
          <div className="absolute inset-0 bg-[#f2f4f5]" />
          <div className="absolute left-[6%] top-0 h-full w-[130px] bg-[#4e6bf0]/85" />
          <div className="absolute left-[24%] top-0 h-full w-[80px] bg-[#f6f7f8]" />
          <div className="absolute right-[18%] top-0 h-full w-[130px] bg-[#4e6bf0]/85" />
          <div className="absolute right-0 top-0 h-full w-[120px] bg-[#cfd8e2]" />
          <div className="absolute left-[-10%] top-[14%] h-[180px] w-[320px] rotate-[38deg] bg-[#4e6bf0]/80" />
          <div className="absolute right-[-8%] top-[36%] h-[180px] w-[320px] rotate-[38deg] bg-[#4e6bf0]/80" />
          <div className="absolute left-[34%] top-[64%] h-[180px] w-[340px] rotate-[38deg] bg-[#ffffff]" />

          <div className="absolute left-[18%] top-[0%] h-[42%] w-[44%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
              alt="investor"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute left-[18%] top-[40%] h-[42%] w-[44%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
              alt="borrower"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute right-[2%] top-[24%] h-[48%] w-[36%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80"
              alt="property work"
              className="h-full w-full object-cover"
            />
          </div>
        </aside>
      </main>

      <footer className="border-t border-[#d9dddd] bg-[#f2f3f3] px-5 py-3 text-[11px] text-[#6b7280]">
        <p>Terms of Service | Privacy Policy | Disclosures</p>
      </footer>
    </div>
  );
}
