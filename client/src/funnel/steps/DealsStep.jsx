import { ArrowRight } from 'lucide-react';
import StepLayout from '../StepLayout.jsx';

function highlightDeals(title) {
  return title.split('completed deals').map((part, idx, arr) => (
    <span key={`${part}-${idx}`}>
      {part}
      {idx < arr.length - 1 ? <span className="text-[#2f54eb]">completed deals</span> : null}
    </span>
  ));
}

export default function DealsStep({
  title,
  description,
  options,
  value,
  setValue,
  canProceed,
  onNext,
  onBack,
  onAutoSelect
}) {
  const content = (
    <div className="space-y-2.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setValue(option.value);
              onAutoSelect?.(option.value);
            }}
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
          className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-5 text-sm font-semibold text-white transition-all duration-150 disabled:bg-[#cfd8ea] disabled:text-white/85"
        >
          Continue <ArrowRight className="ml-1.5 h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <StepLayout
      title={highlightDeals(title)}
      subtitle={description}
      content={content}
    />
  );
}
