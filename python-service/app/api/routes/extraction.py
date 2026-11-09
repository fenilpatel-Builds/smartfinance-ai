from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.config import settings
from app.processors.pdf_processor import process_pdf_statement
from app.processors.excel_processor import process_excel_statement
from app.processors.csv_processor import process_csv_statement
from app.processors.ocr_processor import process_scanned_pdf, process_image_statement
from app.validation.balance_validator import verify_balances
from app.validation.transaction_validator import validate_all_transactions
from app.schemas.statement_schema import StatementExtractionResponse, StatementSummary
from app.schemas.transaction_schema import ExtractedTransaction

router = APIRouter(prefix="/api/v1")

class ExtractRequest(BaseModel):
    filePath: str
    customMapping: Optional[dict] = None
    jobId: Optional[str] = None

class VerifyBalanceRequest(BaseModel):
    transactions: List[ExtractedTransaction]
    openingBalance: float = 0.0
    closingBalance: float = 0.0

@router.post("/extract-pdf", response_model=StatementExtractionResponse)
def extract_pdf_endpoint(req: ExtractRequest):
    return process_pdf_statement(req.filePath, job_id=req.jobId, custom_mapping=req.customMapping)

@router.post("/extract-excel", response_model=StatementExtractionResponse)
def extract_excel_endpoint(req: ExtractRequest):
    return process_excel_statement(req.filePath, job_id=req.jobId, custom_mapping=req.customMapping)

@router.post("/extract-csv", response_model=StatementExtractionResponse)
def extract_csv_endpoint(req: ExtractRequest):
    return process_csv_statement(req.filePath, job_id=req.jobId, custom_mapping=req.customMapping)

@router.post("/extract-ocr", response_model=StatementExtractionResponse)
def extract_ocr_endpoint(req: ExtractRequest):
    return process_scanned_pdf(req.filePath, job_id=req.jobId, custom_mapping=req.customMapping)

@router.post("/extract-image", response_model=StatementExtractionResponse)
def extract_image_endpoint(req: ExtractRequest):
    return process_image_statement(req.filePath, job_id=req.jobId, custom_mapping=req.customMapping)

@router.post("/validate-transactions")
def validate_txs_endpoint(transactions: List[ExtractedTransaction]):
    txs, warnings, errors = validate_all_transactions(transactions)
    return {
        "isValid": len(errors) == 0,
        "warnings": warnings,
        "errors": errors,
        "transactions": [tx.model_dump() for tx in txs]
    }

@router.post("/verify-balance", response_model=StatementSummary)
def verify_balance_endpoint(req: VerifyBalanceRequest):
    summary, warnings, errors, anomalies, quality, conf = verify_balances(
        transactions=req.transactions,
        opening_balance=req.openingBalance,
        stated_closing_balance=req.closingBalance
    )
    return summary

