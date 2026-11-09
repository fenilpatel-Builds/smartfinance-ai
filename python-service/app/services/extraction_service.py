import os
from typing import Dict, Any, Optional
from app.processors.pdf_processor import process_pdf_statement
from app.processors.excel_processor import process_excel_statement
from app.processors.csv_processor import process_csv_statement
from app.processors.ocr_processor import process_scanned_pdf, process_image_statement
from app.schemas.statement_schema import StatementExtractionResponse, StatementPeriod, StatementSummary, StatementValidation

def extract_statement(
    file_path: str,
    job_id: str,
    custom_mapping: Optional[Dict[str, str]] = None
) -> StatementExtractionResponse:
    if not os.path.exists(file_path):
        return StatementExtractionResponse(
            success=False,
            jobId=job_id,
            documentType="unknown",
            detectedBank="Unknown",
            statementPeriod=StatementPeriod(),
            summary=StatementSummary(),
            transactions=[],
            validation=StatementValidation(isValid=False, errors=[f"File not found at {file_path}"])
        )

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return process_pdf_statement(file_path, job_id=job_id, custom_mapping=custom_mapping)
    elif ext in (".xlsx", ".xls"):
        return process_excel_statement(file_path, job_id=job_id, custom_mapping=custom_mapping)
    elif ext in (".csv", ".txt"):
        return process_csv_statement(file_path, job_id=job_id, custom_mapping=custom_mapping)
    elif ext in (".png", ".jpg", ".jpeg", ".tiff", ".tif"):
        return process_image_statement(file_path, job_id=job_id, custom_mapping=custom_mapping)
    else:
        return StatementExtractionResponse(
            success=False,
            jobId=job_id,
            documentType="unsupported",
            detectedBank="Unknown",
            statementPeriod=StatementPeriod(),
            summary=StatementSummary(),
            transactions=[],
            validation=StatementValidation(isValid=False, errors=[f"Unsupported file format: {ext}"])
        )
