import os
import sys
import unittest

# Ensure app is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.processors.csv_processor import process_csv_statement
from app.processors.excel_processor import process_excel_statement
from app.processors.pdf_processor import process_pdf_statement
from app.validation.balance_validator import verify_balances
from app.schemas.transaction_schema import ExtractedTransaction
from app.normalization.date_normalizer import normalize_date
from app.normalization.amount_normalizer import parse_debit_credit

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))

class TestStatementProcessingEngine(unittest.TestCase):
    def test_csv_statement_extraction(self):
        csv_path = os.path.join(SAMPLE_DIR, "csv", "hdfc_sample_statement.csv")
        self.assertTrue(os.path.exists(csv_path), f"CSV sample file not found at {csv_path}")
        
        result = process_csv_statement(csv_path)
        self.assertTrue(result.success)
        self.assertEqual(result.detectedBank, "HDFC Bank")
        self.assertGreater(len(result.transactions), 0)
        self.assertIsNotNone(result.summary)
        self.assertGreater(result.summary.totalCredits, 0)
        self.assertGreater(result.summary.totalDebits, 0)

    def test_excel_statement_extraction(self):
        xlsx_path = os.path.join(SAMPLE_DIR, "excel", "hdfc_sample_statement.xlsx")
        self.assertTrue(os.path.exists(xlsx_path), f"Excel sample file not found at {xlsx_path}")
        
        result = process_excel_statement(xlsx_path)
        self.assertTrue(result.success)
        self.assertEqual(result.detectedBank, "HDFC Bank")
        self.assertGreater(len(result.transactions), 0)
        self.assertGreater(result.summary.totalCredits, 0)

    def test_pdf_statement_extraction(self):
        pdf_path = os.path.join(SAMPLE_DIR, "pdf", "hdfc_sample_statement.pdf")
        self.assertTrue(os.path.exists(pdf_path), f"PDF sample file not found at {pdf_path}")
        
        result = process_pdf_statement(pdf_path)
        self.assertTrue(result.success)
        self.assertEqual(result.detectedBank, "HDFC Bank")
        self.assertGreater(len(result.transactions), 0)

    def test_date_and_amount_normalization(self):
        # Date normalization
        self.assertEqual(normalize_date("02/01/2026"), "2026-01-02")
        self.assertEqual(normalize_date("2026-01-15"), "2026-01-15")
        self.assertEqual(normalize_date("15-Jan-2026"), "2026-01-15")

        # Amount normalization
        debit, credit, tx_type = parse_debit_credit("1,500.50", None, None)
        self.assertEqual(debit, 1500.50)
        self.assertEqual(credit, 0.0)
        self.assertEqual(tx_type, "debit")

        debit2, credit2, tx_type2 = parse_debit_credit(None, "25,000.00", None)
        self.assertEqual(debit2, 0.0)
        self.assertEqual(credit2, 25000.00)
        self.assertEqual(tx_type2, "credit")

    def test_balance_verification_formula(self):
        # Formula: Closing = Opening + Total Credits - Total Debits
        txs = [
            ExtractedTransaction(
                id="tx1",
                transactionDate="2026-01-02",
                description="Client Retainer Payment",
                credit=100000.00,
                debit=0.0,
                amount=100000.00,
                transactionType="credit",
                runningBalance=150000.00,
            ),
            ExtractedTransaction(
                id="tx2",
                transactionDate="2026-01-05",
                description="Office Rent Expense",
                credit=0.0,
                debit=30000.00,
                amount=30000.00,
                transactionType="debit",
                runningBalance=120000.00,
            ),
        ]
        opening = 50000.00
        expected_closing = 120000.00 # 50,000 + 100,000 - 30,000 = 120,000
        
        summary, warnings, errors, anomalies, quality, confidence = verify_balances(
            transactions=txs,
            opening_balance=opening,
            stated_closing_balance=expected_closing
        )

        self.assertEqual(summary.openingBalance, 50000.00)
        self.assertEqual(summary.totalCredits, 100000.00)
        self.assertEqual(summary.totalDebits, 30000.00)
        self.assertEqual(summary.calculatedClosingBalance, 120000.00)
        self.assertEqual(summary.closingBalance, 120000.00)
        self.assertTrue(summary.isBalanceReconciled)
        self.assertEqual(summary.balanceDiscrepancy, 0.0)
        self.assertEqual(quality, "HIGH")

if __name__ == "__main__":
    unittest.main()
