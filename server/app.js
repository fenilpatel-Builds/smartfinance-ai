import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Routes
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import bankAccountRoutes from './routes/bankAccountRoutes.js';
import statementRoutes from './routes/statementRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import categorizationRuleRoutes from './routes/categorizationRuleRoutes.js';
import reconciliationRoutes from './routes/reconciliationRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import financialRecordRoutes from './routes/financialRecordRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import documentVaultRoutes from './routes/documentVaultRoutes.js';
import anomalyRoutes from './routes/anomalyRoutes.js';
import financialIntelligenceRoutes from './routes/financialIntelligenceRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';

const app = express();

// Request correlation tracking
app.use(requestId);

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health Checks
const healthResponse = (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartFinance AI Node.js Backend',
    timestamp: new Date().toISOString(),
    correlationId: req.id,
  });
};
app.get('/health', healthResponse);
app.get('/api/v1/health', healthResponse);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/bank-accounts', bankAccountRoutes);
app.use('/api/v1/statements', statementRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/categorization-rules', categorizationRuleRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/financial-records', financialRecordRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/recurring', recurringRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/documents', documentVaultRoutes);
app.use('/api/v1/anomalies', anomalyRoutes);
app.use('/api/v1/intelligence', financialIntelligenceRoutes);
app.use('/api/v1/calendar', calendarRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;

