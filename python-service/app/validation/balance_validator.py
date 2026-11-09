import re
from datetime import datetime
from typing import List, Tuple, Dict, Any
from app.schemas.transaction_schema import ExtractedTransaction
from app.schemas.statement_schema import StatementSummary, StatementAnomaly

def verify_balances(
    transactions: List[ExtractedTransaction],
    opening_balance: float = 0.0,
    stated_closing_balance: float = 0.0
) -> Tuple[StatementSummary, List[str], List[str], List[StatementAnomaly], str, float]:
    warnings: List[str] = []
    errors: List[str] = []
    anomalies: List[StatementAnomaly] = []

    total_credits = 0.0
    total_debits = 0.0
    duplicate_count = 0
    largest_credit = 0.0
    largest_debit = 0.0

    for i, tx in enumerate(transactions):
        if tx.isDuplicate:
            duplicate_count += 1
            continue

        if tx.transactionType == "credit" or tx.credit > 0:
            total_credits += tx.credit
            if tx.credit > largest_credit:
                largest_credit = tx.credit
            # Direction sanity check
            if re.search(r'(?i)\b(atm\s*w\/?d|withdrawal|pos\s*purchase|debit\s*card|charges?)\b', tx.description):
                tx.needsReview = True
                tx.reviewReasons.append("Potential debit classified as credit based on description")
                anomalies.append(StatementAnomaly(
                    type="DIRECTION_MISMATCH",
                    severity="WARNING",
                    description=f"Row {i+1} marked as Credit but contains withdrawal keywords: '{tx.description[:40]}'",
                    affectedRowIndices=[i]
                ))
        else:
            total_debits += tx.debit
            if tx.debit > largest_debit:
                largest_debit = tx.debit
            # Direction sanity check
            if re.search(r'(?i)\b(salary|dividend|interest\s*cr|refund|cashback)\b', tx.description):
                tx.needsReview = True
                tx.reviewReasons.append("Potential credit classified as debit based on description")
                anomalies.append(StatementAnomaly(
                    type="DIRECTION_MISMATCH",
                    severity="WARNING",
                    description=f"Row {i+1} marked as Debit but contains credit keywords: '{tx.description[:40]}'",
                    affectedRowIndices=[i]
                ))

    total_credits = round(total_credits, 2)
    total_debits = round(total_debits, 2)
    net_flow = round(total_credits - total_debits, 2)
    calculated_closing = round(opening_balance + net_flow, 2)

    valid_count = max(1, len(transactions) - duplicate_count)
    avg_amount = round((total_credits + total_debits) / valid_count, 2)

    # Discrepancy comparison
    discrepancy = 0.0
    is_reconciled = False

    if stated_closing_balance != 0.0 or opening_balance != 0.0:
        discrepancy = round(abs(calculated_closing - stated_closing_balance), 2)
        if discrepancy <= 0.02:
            is_reconciled = True
        else:
            warnings.append(
                f"Balance mismatch: Calculated closing balance (₹{calculated_closing:,.2f}) differs from stated closing balance (₹{stated_closing_balance:,.2f}) by ₹{discrepancy:,.2f}."
            )
            anomalies.append(StatementAnomaly(
                type="BALANCE_JUMP",
                severity="CRITICAL" if discrepancy > 100 else "WARNING",
                description=f"Statement opening/closing balance mismatch of ₹{discrepancy:,.2f}.",
                affectedRowIndices=[]
            ))
    else:
        stated_closing_balance = calculated_closing
        is_reconciled = True

    # Validate transaction sequence running balances & detect missing transactions
    running_balance_mismatches = 0
    for i in range(len(transactions) - 1):
        curr_tx = transactions[i]
        next_tx = transactions[i + 1]
        if curr_tx.runningBalance is not None and next_tx.runningBalance is not None:
            # Check chronological flow
            expected_next = round(curr_tx.runningBalance + next_tx.credit - next_tx.debit, 2)
            step_diff = round(abs(expected_next - next_tx.runningBalance), 2)
            
            # Also check reverse chronological order if statement is newest first
            reverse_expected = round(curr_tx.runningBalance - curr_tx.credit + curr_tx.debit, 2)
            reverse_diff = round(abs(reverse_expected - next_tx.runningBalance), 2)

            if step_diff > 0.05 and reverse_diff > 0.05:
                running_balance_mismatches += 1
                curr_tx.needsReview = True
                curr_tx.reviewReasons.append(f"Running balance mismatch with next row (diff: ₹{step_diff:.2f})")
                anomalies.append(StatementAnomaly(
                    type="BALANCE_JUMP",
                    severity="WARNING",
                    description=f"Running balance step jump between row {i+1} and row {i+2} (discrepancy: ₹{min(step_diff, reverse_diff):.2f}). Potential missing transaction in statement extract.",
                    affectedRowIndices=[i, i+1]
                ))

    if running_balance_mismatches > 0:
        warnings.append(f"{running_balance_mismatches} running balance discrepancies detected between consecutive rows.")

    # Date sequence gap analysis
    for i in range(len(transactions) - 1):
        try:
            d1 = datetime.strptime(transactions[i].transactionDate, "%Y-%m-%d")
            d2 = datetime.strptime(transactions[i+1].transactionDate, "%Y-%m-%d")
            gap_days = abs((d2 - d1).days)
            if gap_days > 90:
                anomalies.append(StatementAnomaly(
                    type="DATE_SEQUENCE_GAP",
                    severity="INFO",
                    description=f"Large date gap of {gap_days} days detected between row {i+1} ({transactions[i].transactionDate}) and row {i+2} ({transactions[i+1].transactionDate}).",
                    affectedRowIndices=[i, i+1]
                ))
        except Exception:
            pass

    # Overall Confidence & Extraction Quality Scoring
    overall_confidence = 1.0
    if len(errors) > 0:
        overall_confidence -= 0.3
    if discrepancy > 0.02:
        overall_confidence -= 0.25
    if running_balance_mismatches > 0:
        overall_confidence -= min(0.25, running_balance_mismatches * 0.05)
    if duplicate_count > 0:
        overall_confidence -= 0.05
    overall_confidence = max(0.2, round(overall_confidence, 2))

    if overall_confidence >= 0.85 and is_reconciled and running_balance_mismatches == 0:
        extraction_quality = "HIGH"
    elif overall_confidence >= 0.65:
        extraction_quality = "MEDIUM"
    elif overall_confidence >= 0.40:
        extraction_quality = "NEEDS_REVIEW"
    else:
        extraction_quality = "LOW"

    summary = StatementSummary(
        openingBalance=round(opening_balance, 2),
        closingBalance=round(stated_closing_balance, 2),
        calculatedClosingBalance=calculated_closing,
        totalCredits=total_credits,
        totalDebits=total_debits,
        netCashFlow=net_flow,
        transactionCount=len(transactions),
        duplicateCount=duplicate_count,
        isBalanceReconciled=is_reconciled,
        balanceDiscrepancy=discrepancy,
        averageTransactionAmount=avg_amount,
        largestCredit=round(largest_credit, 2),
        largestDebit=round(largest_debit, 2)
    )

    return summary, warnings, errors, anomalies, extraction_quality, overall_confidence
