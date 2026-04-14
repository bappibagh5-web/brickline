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
  addressField
}) {
  const content = (
    <div className="space-y-4">
      {addressField}
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] text-base font-semibold text-white transition-all duration-150 disabled:bg-[#cfd8ea] disabled:text-white/85"
      >
        Next
      </button>
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
