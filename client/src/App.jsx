import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Dynamic lazy import helper for named page exports
const lazyNamed = (importFn, name) =>
  React.lazy(() => importFn().then((mod) => ({ default: mod[name] })));

// Lazy-loaded Page Chunks
const LoginPage = lazyNamed(() => import('./pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('./pages/auth/RegisterPage'), 'RegisterPage');
const DashboardPage = lazyNamed(() => import('./pages/dashboard/DashboardPage'), 'DashboardPage');
const BankAccountsPage = lazyNamed(() => import('./pages/banks/BankAccountsPage'), 'BankAccountsPage');
const StatementsUploadPage = lazyNamed(() => import('./pages/statements/StatementsUploadPage'), 'StatementsUploadPage');
const TransactionsPage = lazyNamed(() => import('./pages/transactions/TransactionsPage'), 'TransactionsPage');
const CategoriesPage = lazyNamed(() => import('./pages/categories/CategoriesPage'), 'CategoriesPage');
const ConsolidationPage = lazyNamed(() => import('./pages/consolidation/ConsolidationPage'), 'ConsolidationPage');
const ReconciliationPage = lazyNamed(() => import('./pages/reconciliation/ReconciliationPage'), 'ReconciliationPage');
const BudgetsPage = lazyNamed(() => import('./pages/budgets/BudgetsPage'), 'BudgetsPage');
const BalanceSheetPage = lazyNamed(() => import('./pages/reports/BalanceSheetPage'), 'BalanceSheetPage');
const ReportsPage = lazyNamed(() => import('./pages/reports/ReportsPage'), 'ReportsPage');
const AIInsightsPage = lazyNamed(() => import('./pages/ai/AIInsightsPage'), 'AIInsightsPage');
const SettingsPage = lazyNamed(() => import('./pages/settings/SettingsPage'), 'SettingsPage');
const GoalsPage = lazyNamed(() => import('./pages/goals/GoalsPage'), 'GoalsPage');
const SubscriptionsPage = lazyNamed(() => import('./pages/subscriptions/SubscriptionsPage'), 'SubscriptionsPage');
const InvoicesPage = lazyNamed(() => import('./pages/invoices/InvoicesPage'), 'InvoicesPage');
const LoansPage = lazyNamed(() => import('./pages/loans/LoansPage'), 'LoansPage');
const ForecastPage = lazyNamed(() => import('./pages/forecast/ForecastPage'), 'ForecastPage');
const HealthScorePage = lazyNamed(() => import('./pages/health/HealthScorePage'), 'HealthScorePage');
const AnomaliesPage = lazyNamed(() => import('./pages/anomalies/AnomaliesPage'), 'AnomaliesPage');
const DocumentVaultPage = lazyNamed(() => import('./pages/vault/DocumentVaultPage'), 'DocumentVaultPage');
const CalendarPage = lazyNamed(() => import('./pages/calendar/CalendarPage'), 'CalendarPage');

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-500">Loading SmartFinance view...</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<LoginPage />} />

        {/* Protected SaaS Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/banks" element={<BankAccountsPage />} />
            <Route path="/upload" element={<StatementsUploadPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/health-score" element={<HealthScorePage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/anomalies" element={<AnomaliesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/vault" element={<DocumentVaultPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/consolidation" element={<ConsolidationPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai" element={<AIInsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
