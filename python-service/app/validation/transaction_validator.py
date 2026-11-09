from typing import List, Tuple
from app.schemas.transaction_schema import ExtractedTransaction, TransactionValidationResult

def validate_transaction(tx: ExtractedTransaction) -> TransactionValidationResult:
    warnings = []
    errors = []

    if not tx.transactionDate:
        errors.append("Missing transaction date.")
    
    if not tx.description or len(tx.description.strip()) == 0:
        errors.append("Missing description.")

    if tx.amount <= 0.0 and tx.debit <= 0.0 and tx.credit <= 0.0:
        errors.append("Transaction amount is zero or negative.")

    if tx.confidenceScore < 0.6:
        warnings.append("Low categorization confidence score.")

    is_valid = len(errors) == 0
    return TransactionValidationResult(isValid=is_valid, warnings=warnings, errors=errors)

def validate_all_transactions(transactions: List[ExtractedTransaction]) -> Tuple[List[ExtractedTransaction], List[str], List[str]]:
    overall_warnings = []
    overall_errors = []

    for i, tx in enumerate(transactions):
        res = validate_transaction(tx)
        if not res.isValid:
            for err in res.errors:
                overall_errors.append(f"Row {i+1}: {err}")
        for warn in res.warnings:
            overall_warnings.append(f"Row {i+1}: {warn}")

    return transactions, overall_warnings, overall_errors

