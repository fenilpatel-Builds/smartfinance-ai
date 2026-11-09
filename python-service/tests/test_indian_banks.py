import os
import sys
import unittest

# Ensure app is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.processors.csv_processor import process_csv_statement
from app.processors.excel_processor import process_excel_statement
from app.processors.pdf_processor import process_pdf_statement

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))
CSV_DIR = os.path.join(SAMPLE_DIR, "csv")
EXCEL_DIR = os.path.join(SAMPLE_DIR, "excel")
PDF_DIR = os.path.join(SAMPLE_DIR, "pdf")

class TestIndianBankStatements(unittest.TestCase):
    def test_sbi_csv_extraction(self):
        p = os.path.join(CSV_DIR, "sbi_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"SBI CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "State Bank of India (SBI)")
        self.assertGreaterEqual(len(res.transactions), 7)
        self.assertGreater(res.summary.totalCredits, 200000)
        self.assertGreater(res.summary.totalDebits, 40000)

    def test_icici_csv_extraction(self):
        p = os.path.join(CSV_DIR, "icici_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"ICICI CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "ICICI Bank")
        self.assertGreaterEqual(len(res.transactions), 5)
        self.assertEqual(res.summary.totalCredits, 205000.0)

    def test_icici_excel_extraction(self):
        p = os.path.join(EXCEL_DIR, "icici_sample_statement.xlsx")
        res = process_excel_statement(p)
        self.assertTrue(res.success, f"ICICI Excel failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "ICICI Bank")
        self.assertGreaterEqual(len(res.transactions), 5)

    def test_axis_csv_extraction(self):
        p = os.path.join(CSV_DIR, "axis_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"Axis CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "Axis Bank")
        self.assertGreaterEqual(len(res.transactions), 5)

    def test_bob_csv_extraction(self):
        p = os.path.join(CSV_DIR, "bob_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"BOB CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "Bank of Baroda")
        self.assertGreaterEqual(len(res.transactions), 5)

    def test_pnb_csv_extraction(self):
        p = os.path.join(CSV_DIR, "pnb_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"PNB CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "Punjab National Bank")
        self.assertGreaterEqual(len(res.transactions), 5)

    def test_canara_csv_extraction(self):
        p = os.path.join(CSV_DIR, "canara_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"Canara CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "Canara Bank")
        self.assertGreaterEqual(len(res.transactions), 4)

    def test_union_csv_extraction(self):
        p = os.path.join(CSV_DIR, "union_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"Union CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "Union Bank of India")
        self.assertGreaterEqual(len(res.transactions), 4)

    def test_kotak_csv_extraction(self):
        p = os.path.join(CSV_DIR, "kotak_sample_statement.csv")
        res = process_csv_statement(p)
        self.assertTrue(res.success, f"Kotak CSV failed: {res.validation.errors}")
        self.assertEqual(res.detectedBank, "Kotak Mahindra Bank")
        self.assertGreaterEqual(len(res.transactions), 5)

    def test_hdfc_all_formats(self):
        # CSV
        res_csv = process_csv_statement(os.path.join(CSV_DIR, "hdfc_sample_statement.csv"))
        self.assertTrue(res_csv.success)
        self.assertEqual(res_csv.detectedBank, "HDFC Bank")

        # Excel
        res_excel = process_excel_statement(os.path.join(EXCEL_DIR, "hdfc_sample_statement.xlsx"))
        self.assertTrue(res_excel.success)
        self.assertEqual(res_excel.detectedBank, "HDFC Bank")

        # PDF
        res_pdf = process_pdf_statement(os.path.join(PDF_DIR, "hdfc_sample_statement.pdf"))
        self.assertTrue(res_pdf.success)
        self.assertEqual(res_pdf.detectedBank, "HDFC Bank")

    def test_sbi_pdf_extraction(self):
        p = os.path.join(PDF_DIR, "sbi_sample_statement.pdf")
        res = process_pdf_statement(p)
        self.assertTrue(res.success)
        self.assertEqual(res.detectedBank, "State Bank of India (SBI)")

    def test_axis_pdf_extraction(self):
        p = os.path.join(PDF_DIR, "axis_sample_statement.pdf")
        res = process_pdf_statement(p)
        self.assertTrue(res.success)
        self.assertEqual(res.detectedBank, "Axis Bank")

if __name__ == "__main__":
    unittest.main()
