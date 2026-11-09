# SmartFinance AI — REST API Documentation

Base URL: `http://localhost:5000/api/v1`

All protected requests require an `Authorization: Bearer <token>` header, along with an optional `x-workspace-id: <workspaceId>` header.

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user and auto-create default workspace |
| `POST` | `/auth/login` | Authenticate with email & password, returns JWT & workspaces |
| `GET` | `/auth/me` | Fetch authenticated profile and assigned workspaces |
| `POST` | `/auth/logout` | Invalidate current session |

---

## 2. Workspaces (`/workspaces`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/workspaces` | Create an additional financial workspace |
| `GET` | `/workspaces` | List all workspaces accessible to the authenticated user |
| `GET` | `/workspaces/current` | Retrieve active workspace profile and role |
| `PATCH` | `/workspaces/current` | Update workspace name, base currency, and settings |
| `GET` | `/workspaces/members` | List members and assigned roles |
| `POST` | `/workspaces/invite` | Invite a team member (Accountant, Finance Manager, Viewer) |

---

## 3. Bank Accounts (`/bank-accounts`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/bank-accounts` | Add bank account (auto-masks account number) |
| `GET` | `/bank-accounts` | List accounts with live calculated balances |
| `GET` | `/bank-accounts/:id` | Fetch account details and transaction statistics |
| `PATCH` | `/bank-accounts/:id` | Edit bank account metadata |
| `DELETE` | `/bank-accounts/:id` | Soft delete / archive bank account |

---

## 4. Statements (`/statements`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/statements/upload` | Upload PDF/Excel/CSV, runs Python parser, creates preview |
| `GET` | `/statements` | List upload history and processing statuses |
| `GET` | `/statements/:id/preview` | Retrieve parsed transactions preview before confirmation |
| `POST` | `/statements/:id/confirm-import` | Finalize and insert validated records into MongoDB |
| `DELETE` | `/statements/:id` | Delete statement and optionally cascade transactions |

---

## 5. Transactions (`/transactions`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/transactions` | Paginated search, filters (bank, category, type, date range) |
| `POST` | `/transactions` | Add a manual transaction record |
| `GET` | `/transactions/:id` | View single transaction details |
| `PATCH` | `/transactions/:id` | Update category, notes, or verification status |
| `DELETE` | `/transactions/:id` | Delete transaction and recalculate account balance |
| `POST` | `/transactions/bulk-categorize` | Assign category to an array of transaction IDs |
| `GET` | `/transactions/export` | Export filtered transactions to CSV or Excel |
| `POST` | `/transactions/:id/split` | Split transaction into multiple category allocations |
| `PATCH` | `/transactions/:id/tags` | Update tags and labels for transaction |

---

## 6. Reports & Balance Sheet (`/reports`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports/dashboard` | KPI summary cards, monthly cash flow series, category distribution |
| `GET` | `/reports/bank-summary` | Bank position report (opening, credits, debits, closing) |
| `GET` | `/reports/balance-sheet` | Full accounting balance sheet ($Assets = Liabilities + Equity$) |
| `GET` | `/reports/income-expense` | Detailed operating P&L statement |
| `GET` | `/reports/cash-flow` | Monthly inflow, outflow, and cumulative cash progression |

---

## 7. Financial Goals (`/goals`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/goals` | List financial goals with calculated progress % and monthly savings needed |
| `POST` | `/goals` | Create a new financial goal |
| `PUT` | `/goals/:id` | Update goal target amount, target date, or status |
| `POST` | `/goals/:id/contribute` | Record a savings contribution towards a goal |
| `DELETE` | `/goals/:id` | Remove a financial goal |

---

## 8. Subscriptions & Recurring Intelligence (`/recurring`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/recurring` | List active recurring items with monthly and annual run-rate metrics |
| `POST` | `/recurring/detect` | Heuristic scan of transactions to auto-discover repeating bills |
| `POST` | `/recurring` | Manually register a recurring expense or subscription |
| `PUT` | `/recurring/:id` | Modify amount, frequency, next due date, or toggle Active/Paused |
| `DELETE` | `/recurring/:id` | Remove recurring subscription rule |

---

## 9. Invoicing & Accounts Receivable (`/invoices`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/invoices` | List invoices with filters (Sent, Paid, Overdue) & receivables metrics |
| `GET` | `/invoices/:id` | View invoice details with line item breakdown |
| `POST` | `/invoices` | Generate invoice with auto-calculated subtotals, taxes, and totals |
| `PUT` | `/invoices/:id` | Update invoice line items, due dates, or customer details |
| `POST` | `/invoices/:id/payment` | Record full or partial payment and link deposit transaction |
| `DELETE` | `/invoices/:id` | Delete invoice record |

---

## 10. Loans & Amortization (`/loans`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/loans` | List business loans, debt service burden, and remaining liabilities |
| `GET` | `/loans/:id` | View loan details and monthly amortization schedule ($n$ months) |
| `POST` | `/loans` | Create loan and generate exact mathematical EMI schedule |
| `POST` | `/loans/:id/payment` | Record EMI payment, decrement remaining principal, advance next date |
| `DELETE` | `/loans/:id` | Delete loan record |

---

## 11. Secure Document Vault (`/documents`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/documents` | List archived files with category and tag filters |
| `POST` | `/documents/upload` | Multipart file upload with SHA-256 cryptographic checksum |
| `GET` | `/documents/:id/download` | Secure file stream download |
| `DELETE` | `/documents/:id` | Delete vault file and disk storage |

---

## 12. Financial Anomaly Detection (`/anomalies`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/anomalies` | List detected anomalies with severity (Critical, High, Medium, Low) |
| `POST` | `/anomalies/scan` | Audit transactions for spikes, duplicate charges, rapid frequencies |
| `PUT` | `/anomalies/:id` | Update anomaly status (Resolved, Dismissed, Reviewed) |

---

## 13. Financial Intelligence & Forecasting (`/intelligence`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/intelligence/forecast` | 30/60/90-day cash projections (Expected, Conservative, Best-Case) |
| `GET` | `/intelligence/health-score` | Institutional 100-pt financial health score across 4 explainable pillars |
| `GET` | `/intelligence/currency/rates` | Real-time foreign exchange matrix relative to workspace currency |
| `POST` | `/intelligence/currency/convert` | Deterministic FX amount valuation calculator |

---

## 14. Financial Calendar (`/calendar`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/calendar/events` | Month/year aggregated cash flow events (receivables, bills, loan EMIs) |

---

## 15. AI Financial Insights (`/ai`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai/analyze-spending` | Comprehensive spending pattern and savings rate analysis |
| `POST` | `/ai/assistant` | Conversational financial Q&A (Google Gemini / OpenAI / Rule Fallback) |


