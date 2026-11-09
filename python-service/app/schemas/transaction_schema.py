from typing import Optional, Any, Dict, List
from pydantic import BaseModel, Field

class ExtractedTransaction(BaseModel):
    id: Optional[str] = None
    transactionDate: str
    valueDate: Optional[str] = None
    description: str
    normalizedDescription: Optional[str] = None
    referenceNumber: Optional[str] = None
    chequeNumber: Optional[str] = None
    debit: float = 0.0
    credit: float = 0.0
    amount: float = 0.0
    transactionType: str = "debit" # 'debit' | 'credit'
    runningBalance: Optional[float] = None
    category: Optional[str] = "Uncategorized"
    merchant: Optional[str] = None
    isDuplicate: bool = False
    confidenceScore: float = 1.0
    fieldConfidences: Dict[str, float] = Field(default_factory=dict)
    needsReview: bool = False
    reviewReasons: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    rawRow: Optional[Dict[str, Any]] = None

class TransactionValidationResult(BaseModel):
    isValid: bool
    warnings: List[str] = []
    errors: List[str] = []
