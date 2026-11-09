import uuid
import pymupdf as fitz
import pdfplumber
from typing import List, Dict, Any, Optional
from app.parsers.generic_parser import auto_detect_columns
from app.parsers.bank_format_detector import detect_bank_from_text, extract_account_metadata
from app.normalization.date_normalizer import normalize_date
from app.normalization.amount_normalizer import parse_debit_credit, normalize_amount
from app.normalization.transaction_normalizer import clean_description, extract_merchant, extract_reference_number, infer_category
from app.validation.duplicate_detector import detect_duplicates
from app.validation.balance_validator import verify_balances
from app.validation.transaction_validator import validate_all_transactions
from app.schemas.transaction_schema import ExtractedTransaction
from app.schemas.statement_schema import StatementExtractionResponse, StatementPeriod, StatementValidation
from app.processors.ocr_processor import process_scanned_pdf

def process_pdf_statement(
    file_path: str,
    job_id: Optional[str] = None,
    custom_mapping: Optional[Dict[str, str]] = None
) -> StatementExtractionResponse:
    job_id = job_id or str(uuid.uuid4())

    # Step 1: Check if PDF has extractable text using PyMuPDF
    doc = fitz.open(file_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    doc.close()

    # If the PDF has very little text (< 60 chars per page), it is likely a scanned image PDF
    if len(full_text.strip()) < 50:
        return process_scanned_pdf(file_path, job_id=job_id, custom_mapping=custom_mapping)

    detected_bank, confidence = detect_bank_from_text(full_text)
    metadata = extract_account_metadata(full_text)

    # Step 2: Extract tables across pages using pdfplumber
    extracted_rows: List[List[str]] = []
    headers: List[str] = []

    with pdfplumber.open(file_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            if not tables:
                # Try with different line tolerance if table lines are faint
                tables = page.extract_tables({
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text",
                    "snap_tolerance": 4,
                    "join_tolerance": 4,
                })

            for table in tables:
                for row_idx, row in enumerate(table):
                    cleaned_row = [str(cell).strip() if cell is not None else "" for cell in row]
                    if not any(cleaned_row):
                        continue

                    # If we haven't found headers yet, check if this row has headers
                    row_lower = [c.lower() for c in cleaned_row]
                    if not headers:
                        if any("date" in c for c in row_lower) and (
                            any("desc" in c or "particular" in c or "narr" in c for c in row_lower) or
                            any("debit" in c or "withdraw" in c or "amount" in c for c in row_lower)
                        ):
                            headers = cleaned_row
                            continue
                    else:
                        # Skip if repeat header row on subsequent pages
                        if any("date" in c for c in row_lower) and any("desc" in c or "narr" in c or "particular" in c for c in row_lower):
                            continue
                        extracted_rows.append(cleaned_row)

    # Fallback: if table extractor didn't extract rows, try text line parsing
    if not extracted_rows:
        return _fallback_text_line_parsing(full_text, job_id, detected_bank, metadata)

    mapping = custom_mapping or {}
    if not mapping:
        mapping, is_confident = auto_detect_columns(headers)
        if not is_confident and not ("date" in mapping and ("amount" in mapping or "debit" in mapping)):
            return StatementExtractionResponse(
                success=True,
                jobId=job_id,
                documentType="pdf",
                detectedBank=detected_bank,
                statementPeriod=StatementPeriod(),
                summary=verify_balances([])[0],
                transactions=[],
                validation=StatementValidation(isValid=False, warnings=["Column mapping required: could not identify headers automatically."]),
                columnMappingRequired=True,
                availableHeaders=headers
            )

    # Map column positions by index
    col_indices = {}
    for key, header_name in mapping.items():
        if header_name in headers:
            col_indices[key] = headers.index(header_name)

    date_idx = col_indices.get("date")
    desc_idx = col_indices.get("description")
    ref_idx = col_indices.get("reference")
    debit_idx = col_indices.get("debit")
    credit_idx = col_indices.get("credit")
    amount_idx = col_indices.get("amount")
    balance_idx = col_indices.get("balance")

    extracted_txs: List[ExtractedTransaction] = []
    earliest_date = None
    latest_date = None

    for row in extracted_rows:
        if date_idx is None or date_idx >= len(row):
            continue

        raw_date = row[date_idx]
        norm_date = normalize_date(raw_date)
        if not norm_date:
            continue

        raw_desc = row[desc_idx] if desc_idx is not None and desc_idx < len(row) else ""
        cleaned_desc = clean_description(raw_desc)
        if not cleaned_desc or cleaned_desc.lower() in ("total", "closing balance", "opening balance"):
            continue

        raw_debit = row[debit_idx] if debit_idx is not None and debit_idx < len(row) else None
        raw_credit = row[credit_idx] if credit_idx is not None and credit_idx < len(row) else None
        raw_amount = row[amount_idx] if amount_idx is not None and amount_idx < len(row) else None

        debit, credit, tx_type = parse_debit_credit(raw_debit, raw_credit, raw_amount)
        if debit == 0.0 and credit == 0.0:
            continue

        amount = credit if tx_type == "credit" else debit

        running_bal = None
        if balance_idx is not None and balance_idx < len(row):
            running_bal = normalize_amount(row[balance_idx])

        ref_num = row[ref_idx].strip() if ref_idx is not None and ref_idx < len(row) and row[ref_idx] else None
        if not ref_num:
            ref_num = extract_reference_number(cleaned_desc)

        merchant = extract_merchant(cleaned_desc)
        category, confidence_score = infer_category(cleaned_desc, tx_type)

        tx = ExtractedTransaction(
            id=str(uuid.uuid4()),
            transactionDate=norm_date,
            description=cleaned_desc,
            normalizedDescription=f"{merchant or ''} - {cleaned_desc[:40]}".strip(" -"),
            referenceNumber=ref_num,
            debit=debit,
            credit=credit,
            amount=amount,
            transactionType=tx_type,
            runningBalance=running_bal,
            category=category,
            merchant=merchant,
            confidenceScore=confidence_score,
            rawRow={headers[i] if i < len(headers) else f"col_{i}": val for i, val in enumerate(row)}
        )
        extracted_txs.append(tx)

        if not earliest_date or norm_date < earliest_date:
            earliest_date = norm_date
        if not latest_date or norm_date > latest_date:
            latest_date = norm_date

    extracted_txs = detect_duplicates(extracted_txs)

    summary, val_warnings, val_errors, anomalies, extraction_quality, overall_confidence = verify_balances(
        transactions=extracted_txs,
        opening_balance=metadata.get("openingBalance", 0.0),
        stated_closing_balance=metadata.get("closingBalance", 0.0)
    )

    extracted_txs, tx_warnings, tx_errors = validate_all_transactions(extracted_txs)
    all_warnings = val_warnings + tx_warnings
    all_errors = val_errors + tx_errors

    return StatementExtractionResponse(
        success=True,
        jobId=job_id,
        documentType="pdf",
        detectedBank=detected_bank,
        accountHolder=metadata.get("accountHolder"),
        accountNumberMasked=metadata.get("maskedAccountNumber"),
        statementPeriod=StatementPeriod(start=earliest_date, end=latest_date),
        summary=summary,
        transactions=extracted_txs,
        validation=StatementValidation(
            isValid=len(all_errors) == 0,
            warnings=all_warnings,
            errors=all_errors,
            anomalies=anomalies,
            extractionQuality=extraction_quality,
            overallConfidence=overall_confidence
        ),
        columnMappingRequired=False,
        availableHeaders=headers,
        ocrUsed=False
    )

def _fallback_text_line_parsing(
    full_text: str,
    job_id: str,
    detected_bank: str,
    metadata: Dict[str, Any]
) -> StatementExtractionResponse:
    import re
    extracted_txs: List[ExtractedTransaction] = []
    lines = full_text.splitlines()

    earliest_date = None
    latest_date = None

    # Matches lines starting with a date followed by words and ending with amounts
    # e.g.: 12/01/2026 UPI/Zomato/12345 500.00 4500.00
    date_regex = re.compile(r'^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?(?:\s+([\d,]+\.\d{2}))?$')

    for line in lines:
        line = line.strip()
        m = date_regex.match(line)
        if m:
            raw_date, raw_desc, amt1, amt2, amt3 = m.groups()
            norm_date = normalize_date(raw_date)
            if not norm_date:
                continue

            cleaned_desc = clean_description(raw_desc)
            # Determine debit/credit/balance from available amount tokens
            amt1_val = normalize_amount(amt1)
            amt2_val = normalize_amount(amt2) if amt2 else None
            amt3_val = normalize_amount(amt3) if amt3 else None

            debit, credit = 0.0, 0.0
            running_bal = None
            tx_type = "debit"

            if amt3_val is not None:
                # 3 amounts: debit, credit, balance
                debit, credit, tx_type = parse_debit_credit(amt1_val, amt2_val)
                running_bal = amt3_val
            elif amt2_val is not None:
                # 2 amounts: amount, balance
                if "cr" in cleaned_desc.lower() or "salary" in cleaned_desc.lower() or "deposit" in cleaned_desc.lower():
                    credit = amt1_val
                    tx_type = "credit"
                else:
                    debit = amt1_val
                    tx_type = "debit"
                running_bal = amt2_val
            else:
                debit = amt1_val
                tx_type = "debit"

            amount = credit if tx_type == "credit" else debit
            merchant = extract_merchant(cleaned_desc)
            category, conf = infer_category(cleaned_desc, tx_type)
            ref_num = extract_reference_number(cleaned_desc)

            tx = ExtractedTransaction(
                id=str(uuid.uuid4()),
                transactionDate=norm_date,
                description=cleaned_desc,
                normalizedDescription=f"{merchant or ''} - {cleaned_desc[:40]}".strip(" -"),
                referenceNumber=ref_num,
                debit=debit,
                credit=credit,
                amount=amount,
                transactionType=tx_type,
                runningBalance=running_bal,
                category=category,
                merchant=merchant,
                confidenceScore=conf
            )
            extracted_txs.append(tx)

            if not earliest_date or norm_date < earliest_date:
                earliest_date = norm_date
            if not latest_date or norm_date > latest_date:
                latest_date = norm_date

    extracted_txs = detect_duplicates(extracted_txs)
    summary, val_warnings, val_errors, anomalies, extraction_quality, overall_confidence = verify_balances(
        transactions=extracted_txs,
        opening_balance=metadata.get("openingBalance", 0.0),
        stated_closing_balance=metadata.get("closingBalance", 0.0)
    )

    return StatementExtractionResponse(
        success=True,
        jobId=job_id,
        documentType="pdf",
        detectedBank=detected_bank,
        accountHolder=metadata.get("accountHolder"),
        accountNumberMasked=metadata.get("maskedAccountNumber"),
        statementPeriod=StatementPeriod(start=earliest_date, end=latest_date),
        summary=summary,
        transactions=extracted_txs,
        validation=StatementValidation(
            isValid=len(val_errors) == 0,
            warnings=val_warnings,
            errors=val_errors,
            anomalies=anomalies,
            extractionQuality=extraction_quality,
            overallConfidence=overall_confidence
        ),
        columnMappingRequired=False,
        availableHeaders=[],
        ocrUsed=False
    )
