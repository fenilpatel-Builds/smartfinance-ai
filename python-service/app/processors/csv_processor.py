import csv
import io
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

def process_csv_statement(
    file_path: str,
    job_id: Optional[str] = None,
    custom_mapping: Optional[Dict[str, str]] = None
) -> StatementExtractionResponse:
    job_id = job_id or str(uuid.uuid4())
    
    # Read file lines to extract header metadata & detect delimiter
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        first_lines = [f.readline() for _ in range(25)]
    
    joined_sample = "\n".join(first_lines)
    detected_bank, confidence = detect_bank_from_text(joined_sample)
    metadata = extract_account_metadata(joined_sample)

    # Detect delimiter
    delimiter = ","
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff("".join(first_lines[:10]))
        delimiter = dialect.delimiter
    except Exception:
        pass

    # Read dataframe, find the header row by looking for date/particulars keywords
    header_idx = 0
    for idx in range(min(15, len(first_lines))):
        try:
            temp_df = pd.read_csv(file_path, skiprows=idx, nrows=5, sep=delimiter, engine="python")
            cols = [str(c).lower() for c in temp_df.columns]
            has_date = any("date" in c for c in cols)
            has_desc = any(k in c for c in cols for k in ("desc", "narr", "particular", "remark", "detail", "memo"))
            has_amount = any(k in c for c in cols for k in ("debit", "credit", "amount", "withdraw", "deposit", "balance", "dr", "cr"))
            if has_date and (has_desc or has_amount):
                header_idx = idx
                break
        except Exception:
            continue

    df = pd.read_csv(file_path, skiprows=header_idx, sep=delimiter, engine="python", dtype=str)
    # Strip whitespace from columns
    df.columns = [str(c).strip() for c in df.columns]

    available_headers = list(df.columns)
    mapping = custom_mapping or {}
    
    if not mapping:
        mapping, is_confident = auto_detect_columns(available_headers)
        if not is_confident and not ("date" in mapping and ("amount" in mapping or "debit" in mapping)):
            return StatementExtractionResponse(
                success=True,
                jobId=job_id,
                documentType="csv",
                detectedBank=detected_bank,
                statementPeriod=StatementPeriod(),
                summary=verify_balances([])[0],
                transactions=[],
                validation=StatementValidation(isValid=False, warnings=["Column mapping required: could not confidently identify date, description, or amount columns."]),
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
        # Check if row is mostly empty or summary footer
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

        # Amounts
        raw_debit = row.get(debit_col) if debit_col else None
        raw_credit = row.get(credit_col) if credit_col else None
        raw_amount = row.get(amount_col) if amount_col else None
        debit, credit, tx_type = parse_debit_credit(raw_debit, raw_credit, raw_amount)

        if debit == 0.0 and credit == 0.0:
            continue

        amount = credit if tx_type == "credit" else debit

        # Running balance
        running_bal = None
        if balance_col and pd.notna(row.get(balance_col)):
            running_bal = normalize_amount(row.get(balance_col))

        # Reference
        ref_num = None
        if ref_col and pd.notna(row.get(ref_col)):
            ref_num = str(row.get(ref_col)).strip()
        if not ref_num:
            ref_num = extract_reference_number(cleaned_desc)

        # Merchant & category
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

    # Duplicate detection
    extracted_txs = detect_duplicates(extracted_txs)

    # Balance validation
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
        documentType="csv",
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

