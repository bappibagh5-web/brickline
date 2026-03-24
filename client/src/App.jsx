import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import DashboardApp from './dashboard/DashboardApp.jsx';
import { funnelConfig, funnelInitialStepId } from './funnel/config.js';
import { useFunnel } from './funnel/FunnelContext.jsx';
import FunnelStepPage from './funnel/FunnelStepPage.jsx';
import { getStoredApplicationId } from './funnel/session.js';
import { getResumeTargetRoute } from './funnel/utils.js';
import { getRoleHomeRoute } from './lib/roleRouting.js';
import Admin from './pages/Admin.jsx';
import Broker from './pages/Broker.jsx';
import Lender from './pages/Lender.jsx';
import Login from './pages/Login.jsx';
import SetPassword from './pages/SetPassword.jsx';
import SuperAdmin from './pages/SuperAdmin.jsx';

const ROUTE_TO_PAGE = {
  '/dashboard': 'home',
  '/': 'home',
  '/loan-requests': 'loan-requests',
  '/documents': 'documents',
  '/messages': 'messages',
  '/tasks': 'tasks',
  '/resources': 'resources'
};

const PAGE_TO_ROUTE = {
  home: '/dashboard',
  'loan-requests': '/loan-requests',
  documents: '/documents',
  messages: '/messages',
  tasks: '/tasks',
  resources: '/resources'
};

function DashboardRouteView() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hydrateAnswers } = useFunnel();

  const activePage = ROUTE_TO_PAGE[location.pathname] || 'home';

  const handlePageChange = (pageKey) => {
    const route = PAGE_TO_ROUTE[pageKey] || '/dashboard';
    navigate(route);
  };

  const handleStartNewLoan = () => {
    navigate('/get-rate/loan-program');
  };

  const handleGoResources = () => {
    navigate('/resources');
  };

  const handleContinueLoan = async () => {
    const applicationId = getStoredApplicationId();
    if (!applicationId) {
      navigate('/get-rate/loan-program');
      return;
    }

    const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/resume`);
    if (!response.ok) {
      navigate('/get-rate/loan-program');
      return;
    }

    const payload = await response.json();
    if (payload?.data && typeof payload.data === 'object') {
      hydrateAnswers(payload.data);
    }

    const route = getResumeTargetRoute(payload?.last_step, payload?.data || {});
    if (!route) {
      navigate('/get-rate/loan-program');
      return;
    }

    navigate(`${route}?applicationId=${applicationId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    let ignore = false;

    const resumeApplicationIfNeeded = async () => {
      if (location.pathname !== '/dashboard') return;

      const applicationId = getStoredApplicationId();
      if (!applicationId) return;

      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/resume`);

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      if (ignore) return;

      if (payload?.data && typeof payload.data === 'object') {
        hydrateAnswers(payload.data);
      }

      const route = getResumeTargetRoute(payload?.last_step, payload?.data || {});
      if (!route) return;

      navigate(`${route}?applicationId=${applicationId}`, { replace: true });
    };

    resumeApplicationIfNeeded();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, hydrateAnswers, location.pathname, navigate]);

  return (
    <DashboardApp
      activePage={activePage}
      onPageChange={handlePageChange}
      onLogout={handleLogout}
      onStartNewLoan={handleStartNewLoan}
      onGoResources={handleGoResources}
      onContinueLoan={handleContinueLoan}
      userEmail={user?.email || ''}
    />
  );
}

function DashboardByRole() {
  const { role } = useAuth();

  if (role !== 'borrower') {
    return <Navigate to={getRoleHomeRoute(role)} replace />;
  }

  return <DashboardRouteView />;
}

function RoleHomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={getRoleHomeRoute(role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/m/*" element={<FunnelStepPage />} />
      <Route
        path="/get-rate"
        element={<Navigate to={funnelConfig[funnelInitialStepId].route} replace />}
      />
      <Route
        path="/get-rate/loan-program"
        element={<Navigate to={funnelConfig[funnelInitialStepId].route} replace />}
      />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/dashboard" element={<DashboardByRole />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/super_admin" element={<SuperAdmin />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['lender']} />}>
        <Route path="/lender" element={<Lender />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['broker']} />}>
        <Route path="/broker" element={<Broker />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['borrower']} />}>
        <Route path="/loan-requests" element={<DashboardRouteView />} />
        <Route path="/documents" element={<DashboardRouteView />} />
        <Route path="/account-documents" element={<Navigate to="/documents" replace />} />
        <Route path="/messages" element={<DashboardRouteView />} />
        <Route path="/tasks" element={<DashboardRouteView />} />
        <Route path="/resources" element={<DashboardRouteView />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
