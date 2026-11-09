import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PYTHON_ENV: str = os.getenv("PYTHON_ENV", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    SERVICE_SECRET: str = os.getenv("SERVICE_SECRET", "smartfinance_internal_python_secret_2026")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 25000000))
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "")
    OCR_LANGUAGE: str = os.getenv("OCR_LANGUAGE", "eng")
    PROCESSING_TIMEOUT: int = int(os.getenv("PROCESSING_TIMEOUT", 60))

settings = Settings()
