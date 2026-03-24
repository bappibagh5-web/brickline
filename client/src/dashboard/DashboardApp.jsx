import { useMemo } from 'react';
import Card from './components/Card.jsx';
import DashboardLayout from './layout/DashboardLayout.jsx';
import { NAV_ITEMS, advisor, loan_applications, message_threads, messages, recentActivity, conditions } from './data/mockData.js';
import HomePage from './pages/HomePage.jsx';
import LoanRequestsPage from './pages/LoanRequestsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import TasksPage from './pages/TasksPage.jsx';

function PlaceholderPage({ title }) {
  return (
    <Card className="flex min-h-[480px] items-center justify-center">
      <p className="text-2xl font-semibold text-[#4f5a7d]">{title} page placeholder</p>
    </Card>
  );
}

export default function DashboardApp({
  activePage,
  onPageChange,
  onLogout,
  onStartNewLoan,
  onGoResources,
  onContinueLoan,
  userEmail
}) {
  const page = useMemo(() => {
    if (activePage === 'home') {
      return (
        <HomePage
          loan={loan_applications[0]}
          recentActivity={recentActivity}
          onContinueLoan={onContinueLoan}
          onStartNewLoan={onStartNewLoan}
        />
      );
    }

    if (activePage === 'loan-requests') {
      return (
        <LoanRequestsPage
          loans={loan_applications}
          advisor={advisor}
          onContinueLoan={onContinueLoan}
        />
      );
    }

    if (activePage === 'messages') {
      return (
        <MessagesPage
          threads={message_threads}
          chatMessages={messages}
        />
      );
    }

    if (activePage === 'tasks') {
      return (
        <TasksPage
          tasks={conditions}
        />
      );
    }

    if (activePage === 'documents') {
      return <PlaceholderPage title="Account Documents" />;
    }

    if (activePage === 'resources') {
      return <PlaceholderPage title="Resources" />;
    }

    return <PlaceholderPage title="Dashboard" />;
  }, [activePage, onContinueLoan, onStartNewLoan]);

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onPageChange={onPageChange}
      onLogout={onLogout}
      onStartNewLoan={onStartNewLoan}
      onGoResources={onGoResources}
      userEmail={userEmail}
    >
      {page}
    </DashboardLayout>
  );
}
