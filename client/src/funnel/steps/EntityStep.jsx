import StepLayout from '../StepLayout.jsx';

export default function EntityStep({
  title,
  options,
  value,
  setValue,
  canProceed,
  onNext
}) {
  const content = (
    <div className="space-y-2.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setValue(option.value)}
            className={`h-12 w-full rounded-lg border px-4 text-left text-[17px] font-medium transition-all duration-150 ${
              selected
                ? 'border-[#2f54eb] bg-[#eef3ff] text-[#2f54eb]'
                : 'border-[#d4dbeb] bg-white text-[#2f3f66] hover:border-[#2f54eb] hover:bg-[#f5f8ff]'
            }`}
          >
            {option.label}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] text-base font-semibold text-white transition-all duration-150 disabled:bg-[#cfd8ea] disabled:text-white/85"
      >
        Next
      </button>
    </div>
  );

  return <StepLayout title={title} content={content} />;
}
