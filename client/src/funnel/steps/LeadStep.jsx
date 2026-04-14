import { ArrowRight, Mail, Phone, User } from 'lucide-react';
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
  canProceed,
  onNext
}) {
  const content = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <LeadInput
          icon={User}
          value={value?.first_name || ''}
          onChange={(event) => setValue({ ...value, first_name: event.target.value })}
          placeholder="First Name"
        />
        <LeadInput
          icon={User}
          value={value?.last_name || ''}
          onChange={(event) => setValue({ ...value, last_name: event.target.value })}
          placeholder="Last Name"
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <LeadInput
          icon={Mail}
          type="email"
          value={value?.email || ''}
          onChange={(event) => setValue({ ...value, email: event.target.value })}
          placeholder="Email Address"
        />
        <LeadInput
          icon={Phone}
          type="tel"
          value={value?.phone || ''}
          onChange={(event) => setValue({ ...value, phone: event.target.value })}
          placeholder="Phone Number"
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] text-base font-semibold text-white transition-all duration-150 disabled:bg-[#cfd8ea] disabled:text-white/85"
      >
        Continue <ArrowRight className="ml-2 h-5 w-5" />
      </button>

      <p className="pt-0.5 text-xs leading-5 text-[#6a7492]">
        By submitting your info, you agree to our terms and conditions, privacy policy, and cellular
        phone contact policy. You consent to receive phone calls and SMS messages from Brickline and
        its affiliates. We may contact you to provide updates or for marketing purposes. Message
        frequency may depend on your activity. You may opt-out of texting by replying "STOP". Reply
        "HELP" for more information. Message and data rates may apply.
      </p>
    </div>
  );

  return (
    <StepLayout
      title={highlightStepAway(title)}
      subtitle={description}
      content={content}
    />
  );
}
