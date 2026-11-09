import uuid
import pandas as pd
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

def process_excel_statement(
    file_path: str,
    job_id: Optional[str] = None,
    custom_mapping: Optional[Dict[str, str]] = None
) -> StatementExtractionResponse:
    job_id = job_id or str(uuid.uuid4())

    xl = pd.ExcelFile(file_path)
    sheet_name = xl.sheet_names[0]

    # Read raw content to inspect header text & metadata
    raw_df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=30, header=None)
    metadata_text = " ".join([str(val) for val in raw_df.values.flatten() if pd.notna(val)])
    
    detected_bank, confidence = detect_bank_from_text(metadata_text)
    if detected_bank == "Generic Bank Statement":
        import os
        file_bank, file_conf = detect_bank_from_text(f"{os.path.basename(file_path)} {sheet_name}")
        if file_bank != "Generic Bank Statement":
            detected_bank, confidence = file_bank, file_conf

    metadata = extract_account_metadata(metadata_text)

    # Find the header row (row containing date, description/particulars, debit/credit/balance)
    header_idx = 0
    for idx, row in raw_df.iterrows():
        row_vals = [str(v).lower().strip() for v in row.values if pd.notna(v)]
        if any("date" in v for v in row_vals) and (
            any("desc" in v or "narr" in v or "particular" in v for v in row_vals) or
            any("debit" in v or "withdraw" in v or "amount" in v for v in row_vals)
        ):
            header_idx = idx
            break

    df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=header_idx)
    df.columns = [str(c).strip() for c in df.columns]
    available_headers = list(df.columns)

    mapping = custom_mapping or {}
    if not mapping:
        mapping, is_confident = auto_detect_columns(available_headers)
        if not is_confident and not ("date" in mapping and ("amount" in mapping or "debit" in mapping)):
            return StatementExtractionResponse(
                success=True,
                jobId=job_id,
                documentType="excel",
                detectedBank=detected_bank,
                statementPeriod=StatementPeriod(),
                summary=verify_balances([])[0],
                transactions=[],
                validation=StatementValidation(isValid=False, warnings=["Column mapping required: could not identify columns automatically."]),
                columnMappingRequired=True,
                availableHeaders=available_headers
            )

    extracted_txs: List[ExtractedTransaction] = []
    earliest_date = None
    latest_date = None

    date_col = mapping.get("date")
    desc_col = mapping.get("description")
    ref_col = mapping.get("reference")
    debit_col = mapping.get("debit")
    credit_col = mapping.get("credit")
    amount_col = mapping.get("amount")
    balance_col = mapping.get("balance")

    for idx, row in df.iterrows():
        row_str = " ".join([str(val) for val in row.values if pd.notna(val)]).strip()
        if not row_str or len(row_str) < 5:
            continue

        raw_date = row.get(date_col) if date_col else None
        norm_date = normalize_date(raw_date)
        if not norm_date:
            continue

        raw_desc = row.get(desc_col) if desc_col else ""
        cleaned_desc = clean_description(str(raw_desc))
        if not cleaned_desc or cleaned_desc.lower() in ("nan", "none", "total", "summary", "closing balance"):
            continue

        raw_debit = row.get(debit_col) if debit_col else None
        raw_credit = row.get(credit_col) if credit_col else None
        raw_amount = row.get(amount_col) if amount_col else None
        debit, credit, tx_type = parse_debit_credit(raw_debit, raw_credit, raw_amount)

        if debit == 0.0 and credit == 0.0:
            continue

        amount = credit if tx_type == "credit" else debit

        running_bal = None
        if balance_col and pd.notna(row.get(balance_col)):
            running_bal = normalize_amount(row.get(balance_col))

        ref_num = None
        if ref_col and pd.notna(row.get(ref_col)):
            ref_num = str(row.get(ref_col)).strip()
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
            rawRow={k: str(v) for k, v in row.to_dict().items() if pd.notna(v)}
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
        documentType="excel",
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
        availableHeaders=available_headers,
        ocrUsed=False
    )

