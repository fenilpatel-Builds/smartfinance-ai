from fastapi import APIRouter
from app.processors.ocr_processor import check_tesseract_available
from app.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SmartFinance AI Python Processing Engine",
        "environment": settings.PYTHON_ENV,
        "ocrSupported": check_tesseract_available()
    }

