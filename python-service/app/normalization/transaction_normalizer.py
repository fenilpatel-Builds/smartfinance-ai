import re
from typing import Optional, Tuple

# Common merchants and category keywords
MERCHANT_RULES = [
    # Food & Groceries
    (r'(?i)\b(swiggy|zomato|ubereats|mcdonalds|starbucks|dominos|pizza hut|kfc|burger king|blinkit|zepto|instamart|bigbasket|dmart|nature basket)\b', "Food & Dining", 0.95),
    # Shopping & Retail
    (r'(?i)\b(amazon|flipkart|myntra|ajio|tata cliq|zara|h&m|nykaa|ikea|croma|reliance digital|decathlon)\b', "Shopping", 0.95),
    # Travel & Commute
    (r'(?i)\b(uber|ola|rapido|makemytrip|goibibo|irctc|indigo|air india|vistara|spicejet|redbus|cleartrip)\b', "Travel & Commute", 0.95),
    # Fuel & Auto
    (r'(?i)\b(indian oil|iocl|hpcl|bharat petroleum|bpcl|shell|petrol|diesel|cng|fastag)\b', "Fuel & Transportation", 0.95),
    # Utilities & Bills
    (r'(?i)\b(electricity|bescom|tata power|adani electricity|airtel|jio|vi|vodafone|act fibernet|tatasky|dish tv|water supply|gas bill)\b', "Utilities & Bills", 0.90),
    # Entertainment & Subscriptions
    (r'(?i)\b(netflix|spotify|prime video|hotstar|disney|apple\.com|google play|youtube|bookmyshow|pvr|inox)\b', "Entertainment", 0.95),
    # Healthcare & Wellness
    (r'(?i)\b(apollo|pharmeasy|1mg|netmeds|medplus|hospital|clinic|diagnostic|dr\.|pharmacy|gym|cult\.fit)\b', "Healthcare & Wellness", 0.90),
    # Financial Services & Investment
    (r'(?i)\b(zerodha|groww|upstox|angel one|kuvera|indmoney|mutual fund|sip|lic|hdfc life|icici lombard|sbi life|insurance)\b', "Investments & Insurance", 0.90),
    # Salary & Business Income
    (r'(?i)\b(salary|payroll|stipend|wages|dividend|interest cr|payout|client payment)\b', "Salary & Income", 0.95),
    # Banking Charges
    (r'(?i)\b(chrg|charge|annual fee|sms charge|penal interest|overdraft fee|cheque return|minimum balance|gst@)\b', "Bank Charges", 0.95),
    # Internal / Own Account Transfers
    (r'(?i)\b(self transfer|to self|from self|own a\/c|sweep trf|linked a\/c)\b', "Transfers", 0.95),
    # General Transfers
    (r'(?i)\b(upi\/|neft|rtgs|imps|fund transfer|trf to|trf from|payment to)\b', "Bank Transfer", 0.70)
]

def clean_description(raw_desc: str) -> str:
    if not raw_desc:
        return ""
    # Replace multiple spaces/newlines
    cleaned = re.sub(r'\s+', ' ', str(raw_desc)).strip()
    return cleaned

def extract_merchant(description: str) -> Optional[str]:
    desc = clean_description(description)
    
    # Try UPI merchant format: UPI/1234567890/MERCHANT_NAME/... or UPI-MERCHANT_NAME
    upi_match = re.search(r'UPI(?:-|\/)[^\/]+\/([^\/]+)', desc, re.IGNORECASE)
    if upi_match:
        cand = upi_match.group(1).strip()
        if len(cand) > 2 and not cand.isdigit():
            return cand

    # Match against known brands
    for pattern, cat, _ in MERCHANT_RULES:
        m = re.search(pattern, desc)
        if m:
            return m.group(0).title()

    # POS / Card swipe: POS W/D 4321 MERCHANT_NAME CITY
    pos_match = re.search(r'POS\s+(?:W\/D\s+)?(?:\d+\s+)?([A-Za-z0-9\s\.\-]{3,25})', desc, re.IGNORECASE)
    if pos_match:
        return pos_match.group(1).strip().title()

    return None

def extract_reference_number(description: str) -> Optional[str]:
    if not description:
        return None
    
    # Check 12-digit or 6-20 alphanumeric reference numbers (e.g., UPI RRNo, IMPS ref)
    ref_match = re.search(r'\b(UPI\/|IMPS\/|NEFT\/|RTGS\/|REF(?:[:\s#\-])?|CHQ\s*NO\.?\s*)?([0-9]{9,22}|[A-Z0-9]{10,20})\b', description, re.IGNORECASE)
    if ref_match:
        return ref_match.group(2)
    return None

def infer_category(description: str, tx_type: str) -> Tuple[str, float]:
    desc = clean_description(description)
    
    # If credit with salary keywords
    if tx_type == "credit":
        if re.search(r'(?i)\b(salary|payroll|stipend)\b', desc):
            return ("Salary", 0.98)
        if re.search(r'(?i)\b(interest|int\.pd|int cr)\b', desc):
            return ("Interest Income", 0.95)
        if re.search(r'(?i)\b(dividend)\b', desc):
            return ("Investment Returns", 0.95)
        if re.search(r'(?i)\b(refund|reversal|cashback)\b', desc):
            return ("Refunds & Cashbacks", 0.90)

    # Check rule patterns
    for pattern, category, confidence in MERCHANT_RULES:
        if re.search(pattern, desc):
            return (category, confidence)

    # General fallback
    if tx_type == "credit":
        return ("Other Income", 0.50)
    else:
        return ("Other Expenses", 0.50)

