import { ChevronDown } from 'lucide-react';
import Card from './Card.jsx';
import ProgressBar from './ProgressBar.jsx';

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function LoanCard({ loan, compact = false, onContinue }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-[#1c2447]">{loan.loanType}</h3>
            <p className="mt-1 text-sm text-[#505c7e]">{loan.address}</p>
            {!compact ? (
              <p className="mt-3 text-base text-[#323d61]">
                Requested: <span className="font-bold text-[#1d2548]">{money(loan.amountRequested)}</span>
              </p>
            ) : null}
          </div>
          <span className="rounded-full bg-[#d9ecde] px-3 py-1 text-xs font-semibold text-[#3f8b65]">
            {loan.status}
          </span>
        </div>

        <div className="mt-4">
          <ProgressBar value={loan.progress} />
          <div className="mt-2 flex items-center justify-between text-sm text-[#4b5779]">
            <span>{loan.progress}% complete</span>
            <span>Last updated {loan.lastUpdated}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={onContinue} className="topbar-btn">
            {compact ? 'Continue Loan' : 'Continue Application'}
          </button>
          {!compact ? (
            <p className="text-sm text-[#343f61]">
              Next step: <span className="font-semibold">{loan.nextStep}</span>
            </p>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <div className="flex items-center justify-between border-t border-[#e8ebf3] px-5 py-3 text-xs text-[#5f6a8d]">
          <span>Last updated {loan.lastUpdated}</span>
          <ChevronDown size={20} />
        </div>
      ) : null}
    </Card>
  );
}
