import { ArrowRight, Mail, Phone, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import StepLayout from '../StepLayout.jsx';

function highlightStepAway(title) {
  return title.split('step away').map((part, idx, arr) => (
    <span key={`${part}-${idx}`}>
      {part}
      {idx < arr.length - 1 ? <span className="text-[#2f54eb]">step away</span> : null}
    </span>
  ));
}

function LeadInput({ icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a96b6]" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-[#d4dbeb] bg-white pl-10 pr-4 text-base text-[#2f3f66] placeholder:text-[#8a96b6] transition-all duration-150 focus:border-[#2f54eb] focus:outline-none"
      />
    </label>
  );
}

export default function LeadStep({
  title,
  description,
  value,
  setValue,
  onNext,
  onBack
}) {
  const [fieldErrors, setFieldErrors] = useState({});

  const normalized = useMemo(() => {
    const firstName = String(value?.first_name || '').trim();
    const lastName = String(value?.last_name || '').trim();
    const email = String(value?.email || '').trim();
    const phone = String(value?.phone || '').trim();
    const phoneDigits = phone.replace(/\D/g, '');
    return { firstName, lastName, email, phone, phoneDigits };
  }, [value]);

  const validate = () => {
    const nextErrors = {};
    if (!normalized.firstName) nextErrors.first_name = 'First name is required.';
    if (!normalized.lastName) nextErrors.last_name = 'Last name is required.';
    if (!normalized.email) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!normalized.phone) {
      nextErrors.phone = 'Phone number is required.';
    } else if (normalized.phoneDigits.length !== 10) {
      nextErrors.phone = 'Enter a valid 10-digit phone number.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = (fieldName) => {
    if (!fieldErrors[fieldName]) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onNext?.(value);
  };

  const content = (
    <form className="space-y-3" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <div>
          <LeadInput
            icon={User}
            value={value?.first_name || ''}
            onChange={(event) => {
              setValue({ ...value, first_name: event.target.value });
              clearFieldError('first_name');
            }}
            placeholder="First Name"
          />
          {fieldErrors.first_name ? <p className="mt-1 text-xs text-[#b63d3d]">{fieldErrors.first_name}</p> : null}
        </div>
        <div>
          <LeadInput
            icon={User}
            value={value?.last_name || ''}
            onChange={(event) => {
              setValue({ ...value, last_name: event.target.value });
              clearFieldError('last_name');
            }}
            placeholder="Last Name"
          />
          {fieldErrors.last_name ? <p className="mt-1 text-xs text-[#b63d3d]">{fieldErrors.last_name}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <div>
          <LeadInput
            icon={Mail}
            type="email"
            value={value?.email || ''}
            onChange={(event) => {
              setValue({ ...value, email: event.target.value });
              clearFieldError('email');
            }}
            placeholder="Email Address"
          />
          {fieldErrors.email ? <p className="mt-1 text-xs text-[#b63d3d]">{fieldErrors.email}</p> : null}
        </div>
        <div>
          <LeadInput
            icon={Phone}
            type="tel"
            value={value?.phone || ''}
            onChange={(event) => {
              setValue({ ...value, phone: event.target.value });
              clearFieldError('phone');
            }}
            placeholder="Phone Number"
          />
          {fieldErrors.phone ? <p className="mt-1 text-xs text-[#b63d3d]">{fieldErrors.phone}</p> : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 min-w-[88px] items-center justify-center rounded-lg border border-[#d4dbeb] bg-white px-4 text-sm font-semibold text-[#4d5d86] transition-all duration-150 hover:bg-[#f5f8ff]"
        >
          Back
        </button>
        <button
          type="submit"
          className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-5 text-sm font-semibold text-white transition-all duration-150 disabled:bg-[#cfd8ea] disabled:text-white/85"
        >
          Continue <ArrowRight className="ml-1.5 h-4 w-4" />
        </button>
      </div>

      <p className="pt-0.5 text-xs leading-5 text-[#6a7492]">
        By submitting your info, you agree to our terms and conditions, privacy policy, and cellular
        phone contact policy. You consent to receive phone calls and SMS messages from Brickline and
        its affiliates. We may contact you to provide updates or for marketing purposes. Message
        frequency may depend on your activity. You may opt-out of texting by replying "STOP". Reply
        "HELP" for more information. Message and data rates may apply.
      </p>
    </form>
  );

  return (
    <StepLayout
      title={highlightStepAway(title)}
      subtitle={description}
      content={content}
    />
  );
}
