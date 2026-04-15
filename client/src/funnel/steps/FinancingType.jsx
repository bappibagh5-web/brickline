import { ArrowRight, Compass, Construction, House, Landmark } from 'lucide-react';
import StepLayout from '../StepLayout.jsx';

const iconByValue = {
  fix_flip: House,
  new_construction: Construction,
  rental: Landmark,
  unsure: Compass
};

const subtitleByValue = {
  fix_flip: 'Short-term rehab financing',
  new_construction: 'Ground-up build financing',
  rental: 'Cashflow-based financing',
  unsure: 'Help me decide'
};

function highlightFinancing(title) {
  return title.split('financing').map((part, idx, arr) => (
    <span key={`${part}-${idx}`}>
      {part}
      {idx < arr.length - 1 ? <span className="text-[#2f54eb]">financing</span> : null}
    </span>
  ));
}

export default function FinancingType({
  title,
  description,
  options,
  value,
  setValue,
  canProceed,
  onNext,
  onAutoSelect
}) {
  const content = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((option) => {
          const Icon = iconByValue[option.value] || House;
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setValue(option.value);
                onAutoSelect?.(option.value);
              }}
              className={`group h-[106px] rounded-xl border p-4 text-left transition-all duration-200 ${
                selected
                  ? 'border-[#2f54eb] bg-[#eef3ff] shadow-[0_10px_20px_rgba(47,84,235,0.13)]'
                  : 'border-[#d4dbeb] bg-white hover:border-[#2f54eb] hover:shadow-[0_10px_20px_rgba(47,84,235,0.09)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Icon className="mb-2 h-7 w-7 text-[#2f54eb]" strokeWidth={1.8} />
                  <p className="text-[17px] font-semibold leading-tight text-[#13234f]">{option.label}</p>
                  <p className="mt-0.5 text-[13px] leading-tight text-[#6e7b97]">
                    {subtitleByValue[option.value] || ''}
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 shrink-0 text-[#2f54eb]" />
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2f54eb] to-[#2145df] text-base font-semibold text-white transition-all duration-200 disabled:bg-[#cfd8ea] disabled:text-white/85"
      >
        Continue <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );

  return (
    <StepLayout
      title={highlightFinancing(title)}
      subtitle={description}
      content={content}
    />
  );
}
