import StepLayout from '../StepLayout.jsx';

export default function EntityNameStep({
  title,
  value,
  setValue,
  canProceed,
  onNext
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

  return <StepLayout title={title} content={content} />;
}
