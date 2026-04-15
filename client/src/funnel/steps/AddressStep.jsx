import StepLayout from '../StepLayout.jsx';

function highlightPersonalizedRate(title) {
  return title.split('personalized rate').map((part, idx, arr) => (
    <span key={`${part}-${idx}`}>
      {part}
      {idx < arr.length - 1 ? <span className="text-[#2f54eb]">personalized rate</span> : null}
    </span>
  ));
}

export default function AddressStep({
  title,
  description,
  canProceed,
  onNext,
  onBack,
  addressField
}) {
  const content = (
    <div className="space-y-4">
      {addressField}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 min-w-[88px] items-center justify-center rounded-lg border border-[#d4dbeb] bg-white px-4 text-sm font-semibold text-[#4d5d86] transition-all duration-150 hover:bg-[#f5f8ff]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex h-11 min-w-[110px] items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-5 text-sm font-semibold text-white transition-all duration-150 disabled:bg-[#cfd8ea] disabled:text-white/85"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <StepLayout
      title={title?.includes('personalized rate') ? highlightPersonalizedRate(title) : title}
      subtitle={description}
      content={content}
    />
  );
}
