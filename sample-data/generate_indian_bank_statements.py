import os
import csv
import pandas as pd
import fitz # PyMuPDF

SAMPLE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.join(SAMPLE_DIR, "csv")
EXCEL_DIR = os.path.join(SAMPLE_DIR, "excel")
PDF_DIR = os.path.join(SAMPLE_DIR, "pdf")

for d in (CSV_DIR, EXCEL_DIR, PDF_DIR):
    os.makedirs(d, exist_ok=True)

# 1. State Bank of India (SBI)
sbi_csv_content = """STATE BANK OF INDIA
Account Name: APEX GLOBAL TRADING LTD
Account Number: 00000038912345678
IFS Code: SBIN0001234
Branch: NARIMAN POINT, MUMBAI

Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
01/01/2026,01/01/2026,OPENING BALANCE,,0.00,0.00,100000.00
03/01/2026,03/01/2026,NEFT-RELIANCE IND-CLIENT INVOICE-4091,NEFT889120,0.00,75000.00,175000.00
05/01/2026,05/01/2026,UPI-SWIGGY-OFFICE LUNCH-91823,UPI91823,1450.00,0.00,173550.00
10/01/2026,10/01/2026,CHQ PAID-OFFICE LEASE MUMBAI,CHQ100234,35000.00,0.00,138550.00
15/01/2026,15/01/2026,RTGS-TATA CONSULTING-RETAINER-551,RTGS991203,0.00,150000.00,288550.00
20/01/2026,20/01/2026,IMPS-AIRTEL BROADBAND BILL-2311,IMPS12311,4999.00,0.00,283551.00
25/01/2026,25/01/2026,ELECTRICITY BILL MSEB-8812,EPAY8812,6800.00,0.00,276751.00
31/01/2026,31/01/2026,INTEREST CREDIT FY26 Q4,,0.00,2450.00,279201.00
"""

# 2. ICICI Bank
icici_csv_content = """ICICI BANK LIMITED
Account Holder: APEX TECH SOLUTIONS PVT LTD
Account Number: 000405012345
IFSC Code: ICIC0000004
Branch: BANDRA KURLA COMPLEX

Transaction Date,Value Date,Particulars,Cheque Number,Withdrawal Amount (INR),Deposit Amount (INR),Balance (INR)
02/01/2026,02/01/2026,INFOSYS TECH CONSULTING REVENUE,CMS99812,0.00,120000.00,120000.00
04/01/2026,04/01/2026,AWS CLOUD SERVICES IRELAND,DEB4412,24500.00,0.00,95500.00
08/01/2026,08/01/2026,SALARY DISBURSEMENT JAN 2026,CMS1001,45000.00,0.00,50500.00
14/01/2026,14/01/2026,GOOGLE WORKSPACE APEX APPS,CARD8812,3200.00,0.00,47300.00
22/01/2026,22/01/2026,CLIENT RETAINER ZOHO CORP,NEFT1122,0.00,85000.00,132300.00
"""

# 3. Axis Bank
axis_csv_content = """AXIS BANK LTD
Account Name: APEX LOGISTICS ENTERPRISES
Account No: 919020012345678
IFSC Code: UTIB0000010

Tran Date,Particulars,Chq No,Debit,Credit,Balance
01/01/2026,MAHINDRA LOGISTICS SETTLEMENT,NEFT9911,0.00,65000.00,165000.00
06/01/2026,PETROL & DIESEL INDIAN OIL,CARD331,12500.00,0.00,152500.00
12/01/2026,WAREHOUSE STORAGE RENTAL,CHQ554,28000.00,0.00,124500.00
18/01/2026,BLUE DART COURIER CONSIGNMENT,CARD882,4500.00,0.00,120000.00
28/01/2026,FREIGHT REVENUE AMAZON IN,RTGS441,0.00,95000.00,215000.00
"""

# 4. Bank of Baroda (BOB)
bob_csv_content = """BANK OF BARODA
A/C Name: APEX AGRO PRODUCTS
A/C No: 00140200001234
IFSC: BARB0KOLKAT

Date,Narration,Chq/Ref No,Debit,Credit,Running Balance
02/01/2026,ITC AGRO COMMODITY SALE,NEFT8812,0.00,88000.00,188000.00
07/01/2026,TRACTOR FUEL & SERVICE,CHQ991,15400.00,0.00,172600.00
14/01/2026,FERTILIZERS IFFCO PURCHASE,DEB123,22000.00,0.00,150600.00
23/01/2026,GODOWN LEASE ADVANCE,NEFT441,18000.00,0.00,132600.00
29/01/2026,KIRAN AGRO EXPORT SETTLEMENT,RTGS771,0.00,110000.00,242600.00
"""

# 5. Punjab National Bank (PNB)
pnb_csv_content = """PUNJAB NATIONAL BANK
Account Name: APEX TEXTILES & GARMENTS
Account Number: 0153002100012345
IFSC: PUNB0015300

Txn Date,Transaction Details,Cheque No,Debit Amount,Credit Amount,Balance
03/01/2026,RAYMOND TEXTILE SUPPLY REVENUE,NEFT551,0.00,140000.00,240000.00
08/01/2026,COTTON YARN BULK PURCHASE,RTGS992,65000.00,0.00,175000.00
15/01/2026,FACTORY ELECTRICITY POWER BILL,EPAY441,18500.00,0.00,156500.00
21/01/2026,WEAVING MACHINE REPAIR AMC,CHQ332,12000.00,0.00,144500.00
30/01/2026,FABINDIA EXPORT CONSIGNMENT,RTGS112,0.00,95000.00,239500.00
"""

# 6. Canara Bank
canara_csv_content = """CANARA BANK
A/c Name: APEX HEALTHCARE SOLUTIONS
A/c No: 1234101012345
IFSC: CNRB0001234

Date,Description,Reference No,Debit,Credit,Balance
02/01/2026,APOLLO HOSPITALS EQUIPMENT SUPPLY,NEFT441,0.00,180000.00,280000.00
09/01/2026,SURGICAL GLOVES & CONSUMABLES,DEB881,32000.00,0.00,248000.00
16/01/2026,DIAGNOSTIC LAB LEASE RENTAL,CHQ119,40000.00,0.00,208000.00
25/01/2026,FORTIS HEALTHCARE REVENUE,RTGS771,0.00,95000.00,303000.00
"""

# 7. Union Bank of India
union_csv_content = """UNION BANK OF INDIA
Account Name: APEX RENEWABLE ENERGY
Account Number: 312401010012345
IFSC: UBIN0531243

Date,Remarks,Ref No,Withdrawal,Deposit,Balance
04/01/2026,SOLAR PANEL INSTALLATION TATA POWER,RTGS881,0.00,250000.00,350000.00
11/01/2026,INVERTER COMPONENT IMPORTS,DEB331,85000.00,0.00,265000.00
19/01/2026,SITE SAFETY & TESTING AUDIT,CHQ992,15000.00,0.00,250000.00
27/01/2026,ADANI SOLAR GRID SETTLEMENT,RTGS441,0.00,135000.00,385000.00
"""

# 8. Kotak Mahindra Bank
kotak_csv_content = """KOTAK MAHINDRA BANK
Account Name: APEX DIGITAL MARKETING
Account Number: 2911234567
IFSC: KKBK0000123

Date,Narration,Chq/Ref Number,Debit,Credit,Balance
02/01/2026,META ADS MARKETING CAMPAIGN,CARD991,45000.00,0.00,155000.00
07/01/2026,CLIENT SEO RETAINER FLIPKART,NEFT331,0.00,85000.00,240000.00
14/01/2026,CANVA ENTERPRISE SUBSCRIPTION,CARD112,6500.00,0.00,233500.00
22/01/2026,CREATIVE VIDEO AGENCY CHARGES,NEFT881,25000.00,0.00,208500.00
29/01/2026,ZOMATO BRAND SPONSORSHIP,RTGS551,0.00,120000.00,328500.00
"""

bank_csvs = {
    "sbi_sample_statement.csv": sbi_csv_content,
    "icici_sample_statement.csv": icici_csv_content,
    "axis_sample_statement.csv": axis_csv_content,
    "bob_sample_statement.csv": bob_csv_content,
    "pnb_sample_statement.csv": pnb_csv_content,
    "canara_sample_statement.csv": canara_csv_content,
    "union_sample_statement.csv": union_csv_content,
    "kotak_sample_statement.csv": kotak_csv_content,
}

print("Generating Indian Bank CSV Statements...")
for filename, content in bank_csvs.items():
    p = os.path.join(CSV_DIR, filename)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  -> Generated {p}")

# Generate Excel Statement for ICICI Bank
print("\nGenerating ICICI Excel Statement...")
icici_df = pd.DataFrame([
    {"Transaction Date": "02/01/2026", "Value Date": "02/01/2026", "Particulars": "INFOSYS TECH CONSULTING REVENUE", "Cheque Number": "CMS99812", "Withdrawal Amount (INR)": 0.0, "Deposit Amount (INR)": 120000.0, "Balance (INR)": 120000.0},
    {"Transaction Date": "04/01/2026", "Value Date": "04/01/2026", "Particulars": "AWS CLOUD SERVICES IRELAND", "Cheque Number": "DEB4412", "Withdrawal Amount (INR)": 24500.0, "Deposit Amount (INR)": 0.0, "Balance (INR)": 95500.0},
    {"Transaction Date": "08/01/2026", "Value Date": "08/01/2026", "Particulars": "SALARY DISBURSEMENT JAN 2026", "Cheque Number": "CMS1001", "Withdrawal Amount (INR)": 45000.0, "Deposit Amount (INR)": 0.0, "Balance (INR)": 50500.0},
    {"Transaction Date": "14/01/2026", "Value Date": "14/01/2026", "Particulars": "GOOGLE WORKSPACE APEX APPS", "Cheque Number": "CARD8812", "Withdrawal Amount (INR)": 3200.0, "Deposit Amount (INR)": 0.0, "Balance (INR)": 47300.0},
    {"Transaction Date": "22/01/2026", "Value Date": "22/01/2026", "Particulars": "CLIENT RETAINER ZOHO CORP", "Cheque Number": "NEFT1122", "Withdrawal Amount (INR)": 0.0, "Deposit Amount (INR)": 85000.0, "Balance (INR)": 132300.0},
])
icici_excel_path = os.path.join(EXCEL_DIR, "icici_sample_statement.xlsx")
icici_df.to_excel(icici_excel_path, index=False)
print(f"  -> Generated {icici_excel_path}")

# Generate PDF Statement for State Bank of India (SBI) using PyMuPDF
print("\nGenerating SBI PDF Statement using PyMuPDF...")
doc = fitz.open()
page = doc.new_page(width=595, height=842) # A4

# Header
text = """STATE BANK OF INDIA
Account Statement - Current Account
Account Name: APEX GLOBAL TRADING LTD
Account Number: 00000038912345678
IFS Code: SBIN0001234
Branch: NARIMAN POINT, MUMBAI
Period: 01-Jan-2026 to 31-Jan-2026

Date         Description                               Ref / Chq       Debit (INR)    Credit (INR)    Balance (INR)
-------------------------------------------------------------------------------------------------------------------
01/01/2026   OPENING BALANCE                                                   0.00           0.00       100,000.00
03/01/2026   NEFT-RELIANCE IND-CLIENT INVOICE-4091     NEFT889120              0.00      75,000.00       175,000.00
05/01/2026   UPI-SWIGGY-OFFICE LUNCH-91823             UPI91823            1,450.00           0.00       173,550.00
10/01/2026   CHQ PAID-OFFICE LEASE MUMBAI              CHQ100234          35,000.00           0.00       138,550.00
15/01/2026   RTGS-TATA CONSULTING-RETAINER-551         RTGS991203              0.00     150,000.00       288,550.00
20/01/2026   IMPS-AIRTEL BROADBAND BILL-2311           IMPS12311           4,999.00           0.00       283,551.00
25/01/2026   ELECTRICITY BILL MSEB-8812                EPAY8812            6,800.00           0.00       276,751.00
31/01/2026   INTEREST CREDIT FY26 Q4                                           0.00       2,450.00       279,201.00
"""

page.insert_text(fitz.Point(36, 50), text, fontsize=9, fontname="courier")
sbi_pdf_path = os.path.join(PDF_DIR, "sbi_sample_statement.pdf")
doc.save(sbi_pdf_path)
doc.close()
print(f"  -> Generated {sbi_pdf_path}")

# Generate PDF Statement for Axis Bank using PyMuPDF
print("\nGenerating Axis Bank PDF Statement using PyMuPDF...")
doc_axis = fitz.open()
page_axis = doc_axis.new_page(width=595, height=842)

text_axis = """AXIS BANK LTD
Corporate Account Statement
Account Name: APEX LOGISTICS ENTERPRISES
Account No: 919020012345678
IFSC Code: UTIB0000010
Branch: FORT, MUMBAI

Tran Date    Particulars                               Chq No          Debit (INR)    Credit (INR)    Balance (INR)
-------------------------------------------------------------------------------------------------------------------
01/01/2026   MAHINDRA LOGISTICS SETTLEMENT             NEFT9911                0.00      65,000.00       165,000.00
06/01/2026   PETROL & DIESEL INDIAN OIL                CARD331            12,500.00           0.00       152,500.00
12/01/2026   WAREHOUSE STORAGE RENTAL                  CHQ554             28,000.00           0.00       124,500.00
18/01/2026   BLUE DART COURIER CONSIGNMENT             CARD882             4,500.00           0.00       120,000.00
28/01/2026   FREIGHT REVENUE AMAZON IN                 RTGS441                 0.00      95,000.00       215,000.00
"""

page_axis.insert_text(fitz.Point(36, 50), text_axis, fontsize=9, fontname="courier")
axis_pdf_path = os.path.join(PDF_DIR, "axis_sample_statement.pdf")
doc_axis.save(axis_pdf_path)
doc_axis.close()
print(f"  -> Generated {axis_pdf_path}")

print("\nAll Indian Bank Statements successfully generated!")
