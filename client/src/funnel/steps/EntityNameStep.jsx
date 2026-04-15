import StepLayout from '../StepLayout.jsx';

export default function EntityNameStep({
  title,
  value,
  setValue,
  canProceed,
  onNext,
  onBack
}) {
  const content = (
    <div className="space-y-4">
      <input
        type="text"
        value={value || ''}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type your answer"
        className="h-12 w-full rounded-lg border border-[#d4dbeb] bg-white px-4 text-base text-[#2f3f66] placeholder:text-[#8a96b6] transition-all duration-150 focus:border-[#2f54eb] focus:outline-none"
      />

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

  return <StepLayout title={title} content={content} />;
}
