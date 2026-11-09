import hashlib
from typing import List
from app.schemas.transaction_schema import ExtractedTransaction

def generate_fingerprint(tx: ExtractedTransaction) -> str:
    # Use normalized date, amount, type and first 25 alphanumeric chars of description / ref
    date_part = tx.transactionDate or ""
    amount_part = f"{tx.amount:.2f}"
    type_part = tx.transactionType or "debit"
    ref_part = (tx.referenceNumber or tx.description or "")[:25].strip().lower()
    
    raw = f"{date_part}|{amount_part}|{type_part}|{ref_part}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def detect_duplicates(transactions: List[ExtractedTransaction]) -> List[ExtractedTransaction]:
    seen_hashes = set()
    for tx in transactions:
        fp = generate_fingerprint(tx)
        if fp in seen_hashes:
            tx.isDuplicate = True
        else:
            seen_hashes.add(fp)
    return transactions

