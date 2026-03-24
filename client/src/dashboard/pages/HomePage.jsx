import { Clock3 } from 'lucide-react';
import Card from '../components/Card.jsx';
import LoanCard from '../components/LoanCard.jsx';

export default function HomePage({ loan, recentActivity, onContinueLoan, onStartNewLoan }) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="section-title">Welcome back, Jane</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3>Active Loan Requests</h3>
          <p className="mt-2 text-sm text-[#5f6b8f]">1 active</p>
        </Card>
        <Card className="p-4">
          <h3>Open Tasks</h3>
          <p className="mt-2 text-sm text-[#5f6b8f]">2 items need attention</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2>Your Active Loan</h2>
            <button type="button" onClick={onStartNewLoan} className="topbar-btn">
              Start New Loan
            </button>
          </div>
          <LoanCard loan={loan} compact onContinue={onContinueLoan} />
        </div>

        <Card className="p-4 lg:col-span-4">
          <h2>Recent Activity</h2>
          <div className="mt-3 space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="border-t border-[#edf0f6] pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <Clock3 size={16} className="text-[#7c87a9]" />
                  <p className="text-sm font-semibold text-[#2d375a]">{item.title}</p>
                </div>
                {item.subtitle ? <p className="pl-6 text-xs text-[#6f7898]">{item.subtitle}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
