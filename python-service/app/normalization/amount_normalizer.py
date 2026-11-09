import re
from typing import Any, Tuple

def normalize_amount(val: Any) -> float:
    if val is None:
        return 0.0
    
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ("nan", "none", "null", "-", ""):
        return 0.0

    is_negative = False
    
    # Check parenthesized negative: (100.00)
    if val_str.startswith("(") and val_str.endswith(")"):
        is_negative = True
        val_str = val_str[1:-1]

    # Check trailing or leading Dr / Cr
    val_lower = val_str.lower()
    if "dr" in val_lower or "-" in val_str:
        is_negative = True
    
    # Remove currency symbols, commas, spaces, Dr, Cr, Rs, INR, etc.
    cleaned = re.sub(r'[^\d\.]', '', val_str)
    
    # If multiple dots exist (e.g. OCR error or thousand separators), keep only the last dot as decimal
    if cleaned.count('.') > 1:
        parts = cleaned.split('.')
        cleaned = "".join(parts[:-1]) + "." + parts[-1]

    try:
        amount = float(cleaned)
        return -round(amount, 2) if is_negative else round(amount, 2)
    except (ValueError, TypeError):
        return 0.0

def parse_debit_credit(debit_val: Any, credit_val: Any, amount_val: Any = None) -> Tuple[float, float, str]:
    """
    Returns (debit, credit, transactionType) where transactionType is 'debit' or 'credit'.
    Debit is always non-negative magnitude, Credit is non-negative magnitude.
    """
    debit = abs(normalize_amount(debit_val))
    credit = abs(normalize_amount(credit_val))

    if credit > 0:
        return (0.0, credit, "credit")
    if debit > 0:
        return (debit, 0.0, "debit")

    # If both debit and credit columns were empty or zero, inspect single amount column
    if amount_val is not None:
        raw_amt = normalize_amount(amount_val)
        if raw_amt < 0:
            return (abs(raw_amt), 0.0, "debit")
        elif raw_amt > 0:
            return (0.0, abs(raw_amt), "credit")

    return (0.0, 0.0, "debit")

