# SmartFinance AI — Multi-Bank Statement Analysis & Financial Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24.x-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.12-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://www.mongodb.com/)

**SmartFinance AI** is an enterprise-grade financial document processing and multi-bank management SaaS platform. It eliminates manual bookkeeping by converting bank statements from multiple financial institutions (PDF, Excel, CSV, and Scanned Documents) into organized, categorized, reconciled, and auditable financial intelligence.

---

## Key Modules & Features

1. **Multi-Bank Statement Processing Engine**
   - **Modular Python Service**: PyMuPDF (`pymupdf`), `pdfplumber`, `pandas`, `openpyxl`, `pytesseract`.
   - **Bank Format Detection**: Signatures for Indian & international institutions (HDFC, SBI, ICICI, Axis, Kotak, Chase, Generic).
   - **Format Fallback & Custom Mapping**: Intuitive column mapper when headers deviate from standard banking conventions.
   - **Extraction Sandbox**: Preview, edit, and verify rows before committing to the MongoDB database.

2. **Deterministic Financial Calculation Core**
   - **Reconciliation Equation**: $\text{Closing Balance} = \text{Opening Balance} + \sum \text{Credits} - \sum \text{Debits}$.
   - **Inter-Account Transfer Protection**: Detects and links transfers between your own accounts, preventing artificial P&L revenue/expense double-counting.
   - **Complete Accounting Balance Sheet**: Separates Cash & Bank Summary from complete Balance Sheet ($\text{Assets} = \text{Liabilities} + \text{Equity}$).

3. **Intelligent Transaction Management**
   - Paginated searchable transaction ledger with date, bank, type, and category filters.
   - Bulk categorization and reusable rule builder.
   - One-click CSV and Excel exports.

4. **AI Financial Assistant & Pattern Insights**
   - Integrated with Google Gemini & OpenAI with instant deterministic fallback when API keys are absent.
   - Identifies spending patterns, top counterparties, and budget optimization recommendations.

---

## Monorepo Architecture

```
smartfinance-ai/
├── client/                 # React 18 + Vite + Tailwind CSS + Recharts + Lucide
├── server/                 # Node.js + Express + Mongoose + Multer + JWT
├── python-service/         # FastAPI + PyMuPDF + pdfplumber + pandas + pytesseract
├── sample-data/            # Sample bank statements (PDF, Excel, CSV)
│   ├── csv/
│   ├── excel/
│   └── pdf/
├── docs/                   # Architectural blueprints & API docs
│   ├── architecture.md
│   ├── api-documentation.md
│   └── installation.md
└── package.json            # Monorepo root scripts
```

---

## Quick Start

### 1. Installation
```bash
# Install Node dependencies
npm run install:all

# Install Python requirements
pip install -r python-service/requirements.txt
```

### 2. Start Services

Open three terminal sessions:

```bash
# Terminal 1: Python Processing Service
cd python-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Node.js Express Backend
cd server
npm run dev

# Terminal 3: React Frontend
cd client
npm run dev
```

Visit **http://localhost:5173**

---

## Demo Credentials

The backend automatically seeds demonstration fixtures on first boot:

| Role | Email | Password |
|---|---|---|
| **Workspace Owner** | `owner@smartfinance.ai` | `password123` |
| **Accountant** | `accountant@smartfinance.ai` | `password123` |

*Pre-filled one-click login buttons are also provided directly on the login screen.*

---

## Automated Tests

### 1. Backend & Financial Ledger Tests
Run Node.js backend integration and financial calculation logic tests:
```bash
cd server
npm test
```
Verifies:
- Workspace tenant isolation
- Deterministic bank account balance calculation formula ($\text{Closing Balance} = \text{Opening Balance} + \sum \text{Credits} - \sum \text{Debits}$)
- Inter-account transfer detection and exclusion from net revenue
- Complete accounting balance sheet equation verification ($\text{Assets} = \text{Liabilities} + \text{Equity}$)
- Duplicate transaction SHA-256 fingerprinting & deduplication integrity
- Accounting equation calculation consistency across accounts

### 2. Python Extraction & Document Processing Tests
Run Python test suite for PDF, Excel, and CSV statement parsers:
```bash
cd python-service
python -m unittest tests/test_extraction.py
```
Verifies:
- CSV statement parsing & column extraction
- Excel statement parsing & sheet handling
- PDF vector text & table extraction
- Date and amount normalization
- Balance verification and discrepancy anomaly detection

