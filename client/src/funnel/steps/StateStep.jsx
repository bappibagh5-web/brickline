import StepLayout from '../StepLayout.jsx';

function highlightState(title) {
  return title.split('your property').map((part, idx, arr) => (
    <span key={`${part}-${idx}`}>
      {part}
      {idx < arr.length - 1 ? <span className="text-[#2f54eb]">your property</span> : null}
    </span>
  ));
}

export default function StateStep({
  title,
  value,
  setValue,
  canProceed,
  onNext,
  states
}) {
  const content = (
    <div className="space-y-4">
      <select
        value={value || ''}
        onChange={(event) => setValue(event.target.value)}
        className="h-12 w-full rounded-lg border border-[#d4dbeb] bg-white px-4 text-base text-[#2f3f66] transition-all duration-150 focus:border-[#2f54eb] focus:outline-none"
      >
        <option value="">Select a state</option>
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>

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

  return <StepLayout title={highlightState(title)} content={content} />;
}
