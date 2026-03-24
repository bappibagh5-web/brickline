import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/Card.jsx';
import LoanCard from '../components/LoanCard.jsx';
import Tabs from '../components/Tabs.jsx';

const LOAN_TABS = ['Active', 'Drafts', 'Submitted', 'Closed', 'All'];
const TAB_TO_STATUS = {
  active: 'In Progress',
  drafts: 'Draft',
  submitted: 'Submitted',
  closed: 'Closed'
};

export default function LoanRequestsPage({ loans, advisor, onContinueLoan }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get('tab') || 'active').toLowerCase();
  const activeTab = LOAN_TABS.find((tab) => tab.toLowerCase() === tabParam) || 'Active';

  const visibleLoans = useMemo(() => {
    if (activeTab === 'All') return loans;
    const status = TAB_TO_STATUS[activeTab.toLowerCase()];
    return loans.filter((loan) => loan.status === status);
  }, [activeTab, loans]);

  const handleTabChange = (nextTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab.toLowerCase());
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <section className="space-y-4">
      <h1 className="section-title">Loan Requests</h1>

      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <Tabs tabs={LOAN_TABS} active={activeTab} onChange={handleTabChange} />
        <div className="relative w-full max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b86a8]" />
          <input
            className="h-10 w-full rounded-md border border-[#dde2ef] bg-white pl-10 pr-3 text-sm text-[#2d375a] placeholder:text-[#8f96b4]"
            placeholder="Search by property address"
          />
        </div>
      </div>

      <Card className="p-4">
        {visibleLoans.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-[#d9dfef] bg-white p-8 text-center">
            <div>
              <p className="text-lg font-semibold text-[#2a355a]">No {activeTab.toLowerCase()} loan requests</p>
              <p className="mt-1 text-sm text-[#7580a1]">Try switching tabs or start a new loan.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-9">
              {visibleLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} onContinue={onContinueLoan} />
              ))}
            </div>
            <Card className="p-4 lg:col-span-3">
              <h3>Assigned Advisor</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#becbe2] to-[#f1d7d3]" />
                <div>
                  <p className="text-sm font-semibold text-[#222d52]">{advisor.name}</p>
                  <p className="text-xs text-[#5f6b8f]">{advisor.role}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#5d688b]">{advisor.note}</p>
              <button className="mt-4 h-9 w-full rounded-md border border-[#b9c9f3] bg-[#f1f5ff] text-sm font-semibold text-[#304fbe] transition-all duration-150 hover:bg-[#e4ecff]">
                Chat with me
              </button>
            </Card>
          </div>
        )}
      </Card>
    </section>
  );
}
