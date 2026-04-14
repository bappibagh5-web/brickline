import StepLayout from '../StepLayout.jsx';

export default function CheckEmailStep({
  firstName,
  email,
  onOpenEmail
}) {
  const safeFirstName = String(firstName || '').trim();
  const safeEmail = String(email || '').trim();
  const hasPersonalization = Boolean(safeFirstName && safeEmail);
  const headline = hasPersonalization
    ? `Thanks ${safeFirstName}, check your email to continue.`
    : 'Check your email to continue';
  const subtext = hasPersonalization
    ? `We sent an email to ${safeEmail}. Please follow the link to move forward.`
    : "We've sent you a secure link to continue your application.";

  return (
    <StepLayout
      title={headline}
      content={(
        <div className="space-y-4 pt-2">
          <p className="max-w-[640px] text-[17px] leading-7 text-[#556287]">
            {subtext}
          </p>
          <button
            type="button"
            onClick={onOpenEmail}
            className="inline-flex h-12 min-w-[170px] items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-5 text-base font-semibold text-white transition-all duration-150 hover:brightness-105"
          >
            Open your email
          </button>
          <p className="text-xs leading-5 text-[#7b86a6]">
            Use the secure link in your inbox to continue where you left off.
          </p>
        </div>
      )}
    />
  );
}
