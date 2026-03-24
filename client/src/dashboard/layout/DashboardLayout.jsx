import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

export default function DashboardLayout({
  navItems,
  activePage,
  onPageChange,
  onLogout,
  onStartNewLoan,
  onGoResources,
  userEmail,
  children
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f6fc]">
      <div className="hidden lg:block">
        <Sidebar
          items={navItems}
          activeKey={activePage}
          onSelect={onPageChange}
          onGoResources={onGoResources}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Topbar onLogout={onLogout} onStartNewLoan={onStartNewLoan} userEmail={userEmail} />
        <main className="mx-auto w-full max-w-[1200px] p-4">{children}</main>
      </div>
    </div>
  );
}
