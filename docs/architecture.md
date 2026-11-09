# SmartFinance AI — System Architecture & Design

## 1. High-Level Architecture Overview

SmartFinance AI is engineered as an enterprise-grade financial management and multi-bank document analysis SaaS platform. It consists of three decoupled layers:

```
+-----------------------------------------------------------+
|                    React + Vite Frontend                  |
|     (Tailwind CSS, Recharts, Lucide Icons, React Router)  |
+-----------------------------+-----------------------------+
                              | REST API (JWT & Workspace Header)
                              v
+-----------------------------------------------------------+
|                Node.js + Express Main Backend             |
|   - Workspace Isolation & Role Access Control             |
|   - Deterministic Financial Calculation Engine            |
|   - Multer Storage & Job Pipeline Coordination            |
|   - Inter-Account Transfer Matching                       |
|   - Mongoose ODM (17 Schemas)                             |
+----------------------+--------------------+---------------+
                       |                    |
                       | Internal Secure    | Read/Write
                       | REST Call          v
                       v              +---------------------+
+------------------------------+      |       MongoDB       |
|   Python FastAPI Processor   |      |  (Atlas / In-Memory)|
|  - PyMuPDF & pdfplumber      |      +---------------------+
|  - Pandas & OpenPyXL         |
|  - Tesseract OCR (Scanned)   |
|  - Bank Format Detection     |
|  - Normalization & Dedup     |
+------------------------------+
```

---

## 2. Security & Workspace Isolation
- **Tenant Isolation**: Every financial record (`BankAccount`, `Statement`, `Transaction`, `Budget`, `Asset`, `Liability`, `EquityRecord`, etc.) contains a mandatory indexed `workspaceId`.
- **Zero Trust Role Verification**: Roles (`Super Admin`, `Workspace Owner`, `Finance Manager`, `Accountant`, `Viewer`) are strictly evaluated on the server side via `requireWorkspace` and `requireRoles` middleware.
- **Account Number Masking**: Account numbers are automatically masked (`XXXX-XXXX-4921`) to protect user banking confidentiality.
- **Sanitized AI Ingestion**: Sensitive metadata is stripped and masked before sending prompts to external LLMs (Google Gemini / OpenAI).

---

## 3. Financial Calculation Integrity
- **Deterministic Single Source of Truth**: All financial balances, net cash flow, and reconciliation equations are calculated using deterministic code.
- **Reconciliation Formula**:
  $$\text{Closing Balance} = \text{Opening Balance} + \sum \text{Credits} - \sum \text{Debits}$$
- **Complete Accounting Balance Sheet**:
  $$\text{Total Assets} = \text{Total Liabilities} + \text{Total Equity}$$
- **Inter-Account Transfer Matching**: Outflows from one account matched with inflows into another account belonging to the same workspace within a 3-day threshold are categorized as `Own Account Transfer` and excluded from operational P&L to prevent artificial revenue inflation.

