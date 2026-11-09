import re
from typing import Optional, Dict, Any, Tuple

BANK_SIGNATURES = {
    "HDFC Bank": [
        r"hdfc\s*bank",
        r"hdfc000",
        r"hdfc\s*house",
        r"hdfc"
    ],
    "State Bank of India (SBI)": [
        r"state\s*bank\s*of\s*india",
        r"sbin0",
        r"\bsbi\b"
    ],
    "ICICI Bank": [
        r"icici\s*bank",
        r"icic000",
        r"icici"
    ],
    "Axis Bank": [
        r"axis\s*bank",
        r"utib0",
        r"axis"
    ],
    "Kotak Mahindra Bank": [
        r"kotak\s*mahindra",
        r"kkbk0",
        r"kotak"
    ],
    "Bank of Baroda": [
        r"bank\s*of\s*baroda",
        r"barb0"
    ],
    "Punjab National Bank": [
        r"punjab\s*national\s*bank",
        r"punb0"
    ],
    "Canara Bank": [
        r"canara\s*bank",
        r"cnrb0"
    ],
    "Union Bank of India": [
        r"union\s*bank",
        r"ubin0"
    ]
}

def detect_bank_from_text(text: str) -> Tuple[str, float]:
    """
    Returns (detected_bank_name, confidence)
    """
    if not text:
        return ("Generic Bank Statement", 0.5)

    text_lower = text.lower()
    for bank_name, patterns in BANK_SIGNATURES.items():
        for pat in patterns:
            if re.search(pat, text_lower):
                return (bank_name, 0.95)

    return ("Generic Bank Statement", 0.6)

def extract_account_metadata(text: str) -> Dict[str, Any]:
    metadata = {
        "accountHolder": None,
        "maskedAccountNumber": None,
        "ifscCode": None,
        "openingBalance": 0.0,
        "closingBalance": 0.0,
        "periodStart": None,
        "periodEnd": None
    }

    if not text:
        return metadata

    # Masked Account Number
    acc_match = re.search(r'(?:account|a\/c)\s*(?:no|number)?[\s\:\.\-]+([X\*0-9]{4,20})', text, re.IGNORECASE)
    if acc_match:
        acc_raw = acc_match.group(1).strip()
        if len(acc_raw) >= 4:
            # Mask all but last 4 digits
            last4 = acc_raw[-4:]
            metadata["maskedAccountNumber"] = f"XXXX-XXXX-{last4}"

    # IFSC
    ifsc_match = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', text)
    if ifsc_match:
        metadata["ifscCode"] = ifsc_match.group(1)

    # Opening balance
    op_match = re.search(r'(?:opening\s*bal(?:ance)?|op\.?\s*bal)[\s\:\.\-₹Rs\.]*([\d\,]+(?:\.\d{2})?)', text, re.IGNORECASE)
    if op_match:
        try:
            metadata["openingBalance"] = float(op_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Closing balance
    cl_match = re.search(r'(?:closing\s*bal(?:ance)?|cl\.?\s*bal)[\s\:\.\-₹Rs\.]*([\d\,]+(?:\.\d{2})?)', text, re.IGNORECASE)
    if cl_match:
        try:
            metadata["closingBalance"] = float(cl_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Account Holder
    holder_match = re.search(r'(?:customer\s*name|name\s*of\s*account\s*holder|account\s*name|holder)[\s\:\.\-]+([A-Za-z\s\.]{3,40})', text, re.IGNORECASE)
    if holder_match:
        cand = holder_match.group(1).strip()
        if not re.search(r'(address|branch|statement|date|account)', cand, re.IGNORECASE):
            metadata["accountHolder"] = cand.title()

    return metadata

