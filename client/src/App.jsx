import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BankAccountsPage } from './pages/banks/BankAccountsPage';
import { StatementsUploadPage } from './pages/statements/StatementsUploadPage';
import { TransactionsPage } from './pages/transactions/TransactionsPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { ConsolidationPage } from './pages/consolidation/ConsolidationPage';
import { ReconciliationPage } from './pages/reconciliation/ReconciliationPage';
import { BudgetsPage } from './pages/budgets/BudgetsPage';
import { BalanceSheetPage } from './pages/reports/BalanceSheetPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AIInsightsPage } from './pages/ai/AIInsightsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { GoalsPage } from './pages/goals/GoalsPage';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { LoansPage } from './pages/loans/LoansPage';
import { ForecastPage } from './pages/forecast/ForecastPage';
import { HealthScorePage } from './pages/health/HealthScorePage';
import { AnomaliesPage } from './pages/anomalies/AnomaliesPage';
import { DocumentVaultPage } from './pages/vault/DocumentVaultPage';
import { CalendarPage } from './pages/calendar/CalendarPage';

function App() {
  return (
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
  );
}

export default App;

