from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.statement_schema import StatementExtractionResponse

class BaseBankParser(ABC):
    @abstractmethod
    def parse(self, file_path: str, options: Optional[Dict[str, Any]] = None) -> StatementExtractionResponse:
        pass

