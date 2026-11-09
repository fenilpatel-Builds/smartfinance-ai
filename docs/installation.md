# SmartFinance AI — Installation & Setup Guide

## System Requirements
- **Node.js**: v18.0.0 or higher (Tested on v24.19.0)
- **Python**: 3.10, 3.11, or 3.12 (Tested on Python 3.12.0)
- **npm**: 9.x or higher
- **MongoDB**: MongoDB Atlas URI or local MongoDB instance (An embedded zero-config MongoDB in-memory engine is built-in as an automatic development fallback!)

---

## 1. Quick Start (All Services)

```bash
# 1. Clone repository
git clone <repo-url>
cd SmartFinance-AI

# 2. Install dependencies
npm run install:all
pip install -r python-service/requirements.txt
```

---

## 2. Running Services

Open three terminal windows (or use concurrently):

### Terminal 1 — Python Processing Backend (Port 8000)
```bash
cd python-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 — Node.js Express Main Backend (Port 5000)
```bash
cd server
npm run dev
```

### Terminal 3 — React Vite Frontend (Port 5173)
```bash
cd client
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 3. Demo Credentials

To explore with rich pre-loaded financial statements, categories, budgets, and balance sheet records:

- **Workspace Owner**:
  - Email: `owner@smartfinance.ai`
  - Password: `password123`
- **Accountant**:
  - Email: `accountant@smartfinance.ai`
  - Password: `password123`

You can also click the **"Workspace Owner"** or **"Accountant"** quick-fill button on the login screen for instant one-click login!

---

## 4. Docker Deployment (Single Command)

To run the complete production stack (MongoDB, Python Service, Node.js Backend, React Nginx Frontend) in isolated Docker containers:

```bash
docker-compose up --build -d
```

- React Client: `http://localhost`
- Node.js Backend: `http://localhost:5000`
- Python Service: `http://localhost:8000`

---

## 5. OCR Setup (Optional)
If you wish to parse scanned image bank statements:
- **Windows**: Download Tesseract OCR from [UB Mannheim Tesseract Installer](https://github.com/UB-Mannheim/tesseract/wiki) and set `TESSERACT_CMD` in `python-service/.env`.
- Standard digital PDF, Excel, and CSV statements do not require Tesseract OCR.

