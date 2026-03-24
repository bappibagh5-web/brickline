import { Bell, ChevronDown, Search } from 'lucide-react';

export default function Topbar({ userEmail, onLogout, onStartNewLoan }) {
  return (
    <header className="flex h-16 items-center border-b border-[#dde2ef] bg-white px-4 lg:px-6">
      <div className="relative max-w-[960px] flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8891ad]" />
        <input className="soft-input" placeholder="Search..." />
      </div>

      <div className="ml-4 flex items-center gap-3 lg:ml-8 lg:gap-5">
        <button className="relative rounded-full p-2 text-[#243159] hover:bg-[#edf1fb]">
          <Bell size={24} />
          <span className="absolute right-1 top-1 h-5 w-5 rounded-full bg-[#f05f5d] text-[12px] font-bold text-white">
            1
          </span>
        </button>
        <div className="hidden items-center gap-3 lg:flex">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#9bb2d9] to-[#f4dfd2]" />
          <span className="max-w-[180px] truncate text-sm font-semibold text-[#2a355a]">
            {userEmail || 'User'}
          </span>
        </div>
        <button type="button" onClick={onStartNewLoan} className="topbar-btn">
          Start New Loan <ChevronDown className="ml-2" size={20} />
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-[#dbe2ef] px-4 py-2 text-sm font-semibold text-[#2f53eb] hover:bg-[#eef3ff]"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
