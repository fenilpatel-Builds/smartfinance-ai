import re
from datetime import datetime
from typing import Optional, Any

DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d.%m.%Y",
    "%d/%m/%y",
    "%d-%m-%y",
    "%d.%m.%y",
    "%d %b %Y",
    "%d-%b-%Y",
    "%d/%b/%Y",
    "%d %B %Y",
    "%d-%B-%Y",
    "%b %d, %Y",
    "%B %d, %Y",
    "%m/%d/%Y",
    "%m-%d-%Y",
]

def normalize_date(date_str: Any) -> Optional[str]:
    if not date_str:
        return None
    
    date_str = str(date_str).strip()
    if not date_str or date_str.lower() in ("nan", "nat", "none", "null", "-"):
        return None

    # Remove extra spaces and time components if present
    date_str = date_str.split(" ")[0].strip() if " " in date_str and ":" in date_str else date_str.strip()

    # Try standard formats
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Try regex matching for DD-MM-YYYY or DD/MM/YYYY
    match = re.search(r'(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})', date_str)
    if match:
        d, m, y = match.groups()
        if len(y) == 2:
            y = f"20{y}"
        try:
            # Prefer Day first (standard in Indian and international banking)
            dt = datetime(int(y), int(m), int(d))
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            try:
                # Try Month first if day > 12 and month <= 12
                dt = datetime(int(y), int(d), int(m))
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                pass

    return date_str
