from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.transaction_schema import ExtractedTransaction

class StatementPeriod(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None

class StatementSummary(BaseModel):
    openingBalance: float = 0.0
    closingBalance: float = 0.0
    calculatedClosingBalance: float = 0.0
    totalCredits: float = 0.0
    totalDebits: float = 0.0
    netCashFlow: float = 0.0
    transactionCount: int = 0
    duplicateCount: int = 0
    isBalanceReconciled: bool = False
    balanceDiscrepancy: float = 0.0
    averageTransactionAmount: float = 0.0
    largestCredit: float = 0.0
    largestDebit: float = 0.0

class PageProcessingStatus(BaseModel):
    pageNumber: int
    status: str = "COMPLETED" # 'COMPLETED' | 'WARNING' | 'FAILED' | 'OCR_USED'
    confidence: float = 1.0
    extractedRowCount: int = 0
    hasImages: bool = False
    message: Optional[str] = None

class StatementAnomaly(BaseModel):
    type: str # 'BALANCE_JUMP' | 'DATE_SEQUENCE_GAP' | 'DIRECTION_MISMATCH' | 'DUPLICATE_SPIKE' | 'UNUSUALLY_LARGE'
    severity: str # 'INFO' | 'WARNING' | 'CRITICAL'
    description: str
    affectedRowIndices: List[int] = []

class StatementValidation(BaseModel):
    isValid: bool
    warnings: List[str] = []
    errors: List[str] = []
    anomalies: List[StatementAnomaly] = []
    extractionQuality: str = "HIGH" # 'HIGH' | 'MEDIUM' | 'LOW' | 'NEEDS_REVIEW'
    overallConfidence: float = 1.0

class StatementExtractionResponse(BaseModel):
    success: bool
    jobId: str
    documentType: str
    detectedBank: str
    bankBranch: Optional[str] = None
    accountHolder: Optional[str] = None
    accountNumberMasked: Optional[str] = None
    accountType: Optional[str] = None
    currency: str = "INR"
    statementPeriod: StatementPeriod
    summary: StatementSummary
    transactions: List[ExtractedTransaction]
    validation: StatementValidation
    pageStatuses: List[PageProcessingStatus] = []
    columnMappingRequired: bool = False
    availableHeaders: List[str] = []
    ocrUsed: bool = False
    message: Optional[str] = None
