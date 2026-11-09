import re
from typing import List, Dict, Any, Optional, Tuple

DATE_KEYWORDS = ["date", "txn date", "transaction date", "value date", "post date", "posting date"]
DESC_KEYWORDS = ["narration", "description", "particulars", "remarks", "details", "memo", "transaction details"]
REF_KEYWORDS = ["ref", "reference", "chq", "cheque", "utr", "txn id", "transaction id", "ref no", "rrn"]
DEBIT_KEYWORDS = ["debit", "withdrawal", "dr", "withdrawals", "debit amount"]
CREDIT_KEYWORDS = ["credit", "deposit", "cr", "deposits", "credit amount"]
AMOUNT_KEYWORDS = ["amount", "txn amount", "net amount"]
BALANCE_KEYWORDS = ["balance", "running balance", "closing balance", "bal"]

def match_column_header(header: str, keyword_list: List[str]) -> bool:
    h = header.strip().lower()
    for kw in keyword_list:
        if kw == h or re.search(r'\b' + re.escape(kw) + r'\b', h):
            return True
    return False

def auto_detect_columns(headers: List[str]) -> Tuple[Dict[str, str], bool]:
    """
    Returns (mapping, is_confident)
    mapping: {"date": header_name, "description": header_name, ...}
    """
    mapping = {}
    
    for h in headers:
        if not h:
            continue
        col = str(h).strip()

        if "date" not in mapping and match_column_header(col, DATE_KEYWORDS):
            mapping["date"] = col
        elif "description" not in mapping and match_column_header(col, DESC_KEYWORDS):
            mapping["description"] = col
        elif "reference" not in mapping and match_column_header(col, REF_KEYWORDS):
            mapping["reference"] = col
        elif "debit" not in mapping and match_column_header(col, DEBIT_KEYWORDS):
            mapping["debit"] = col
        elif "credit" not in mapping and match_column_header(col, CREDIT_KEYWORDS):
            mapping["credit"] = col
        elif "amount" not in mapping and match_column_header(col, AMOUNT_KEYWORDS):
            mapping["amount"] = col
        elif "balance" not in mapping and match_column_header(col, BALANCE_KEYWORDS):
            mapping["balance"] = col

    # Check if we have minimum requirements: date + description + (debit/credit or amount)
    has_date = "date" in mapping
    has_desc = "description" in mapping
    has_amount = ("debit" in mapping and "credit" in mapping) or ("amount" in mapping)

    is_confident = has_date and has_desc and has_amount
    return mapping, is_confident

