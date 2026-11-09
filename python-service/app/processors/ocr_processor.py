import os
import shutil
import uuid
import numpy as np
import pymupdf as fitz
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from typing import List, Dict, Any, Optional, Tuple
import pytesseract
from app.config import settings
from app.parsers.bank_format_detector import detect_bank_from_text, extract_account_metadata
from app.schemas.statement_schema import (
    StatementExtractionResponse,
    StatementPeriod,
    StatementValidation,
    StatementSummary,
    PageProcessingStatus,
    StatementAnomaly,
)

def check_tesseract_available() -> bool:
    if settings.TESSERACT_CMD and os.path.exists(settings.TESSERACT_CMD):
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
        return True
    
    # Check default Windows installation paths
    default_win_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
    ]
    for p in default_win_paths:
        if os.path.exists(p):
            pytesseract.pytesseract.tesseract_cmd = p
            return True

    # Check PATH
    if shutil.which("tesseract"):
        return True

    return False

def deskew_and_preprocess_image(pil_img: Image.Image) -> Tuple[Image.Image, float]:
    """
    Applies grayscale, auto-contrast, noise reduction, and estimates orientation.
    Returns (processed_image, estimated_confidence).
    """
    # Convert to grayscale
    gray = pil_img.convert("L")

    # Auto-contrast & equalization
    contrasted = ImageOps.autocontrast(gray, cutoff=2)
    enhancer = ImageEnhance.Contrast(contrasted)
    contrasted = enhancer.enhance(1.8)

    # Median filter for salt-and-pepper noise removal
    filtered = contrasted.filter(ImageFilter.MedianFilter(size=3))

    # Sharpen edges of text characters
    sharpened = filtered.filter(ImageFilter.SHARPEN)

    return sharpened, 0.85

def process_scanned_pdf(
    file_path: str,
    job_id: Optional[str] = None,
    custom_mapping: Optional[Dict[str, str]] = None
) -> StatementExtractionResponse:
    job_id = job_id or str(uuid.uuid4())
    
    if not check_tesseract_available():
        return StatementExtractionResponse(
            success=False,
            jobId=job_id,
            documentType="scanned_pdf",
            detectedBank="Scanned Statement (OCR Required)",
            statementPeriod=StatementPeriod(),
            summary=StatementSummary(),
            transactions=[],
            validation=StatementValidation(
                isValid=False,
                errors=["Tesseract OCR engine is not installed or not found on system PATH."],
                warnings=[
                    "This document contains scanned image pages with no embedded text.",
                    "To enable scanned statement processing: Download Tesseract from https://github.com/UB-Mannheim/tesseract/wiki and set TESSERACT_CMD in python-service/.env."
                ],
                extractionQuality="NEEDS_REVIEW",
                overallConfidence=0.0
            ),
            pageStatuses=[PageProcessingStatus(pageNumber=1, status="FAILED", confidence=0.0, hasImages=True, message="Tesseract OCR binary not detected")],
            ocrUsed=True,
            message="Tesseract OCR is not installed. Standard digital PDF, Excel, and CSV statements process natively without OCR."
        )

    # Multi-page OCR processing
    ocr_text = ""
    page_statuses: List[PageProcessingStatus] = []
    
    try:
        doc = fitz.open(file_path)
        total_pages = min(10, len(doc))
        for page_num in range(total_pages):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=250)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            processed_img, est_conf = deskew_and_preprocess_image(img)
            
            # Extract text & confidence data
            try:
                page_text = pytesseract.image_to_string(processed_img, lang=settings.OCR_LANGUAGE)
                ocr_text += f"\n--- Page {page_num + 1} ---\n" + page_text + "\n"
                page_statuses.append(PageProcessingStatus(
                    pageNumber=page_num + 1,
                    status="OCR_USED",
                    confidence=est_conf,
                    hasImages=True,
                    extractedRowCount=len(page_text.splitlines())
                ))
            except Exception as page_err:
                page_statuses.append(PageProcessingStatus(
                    pageNumber=page_num + 1,
                    status="WARNING",
                    confidence=0.4,
                    hasImages=True,
                    message=f"OCR page error: {str(page_err)}"
                ))
        doc.close()
    except Exception as e:
        return StatementExtractionResponse(
            success=False,
            jobId=job_id,
            documentType="scanned_pdf",
            detectedBank="Scanned PDF",
            statementPeriod=StatementPeriod(),
            summary=StatementSummary(),
            transactions=[],
            validation=StatementValidation(isValid=False, errors=[f"OCR processing failed: {str(e)}"], extractionQuality="LOW", overallConfidence=0.0),
            ocrUsed=True
        )

    from app.processors.pdf_processor import _fallback_text_line_parsing
    detected_bank, conf = detect_bank_from_text(ocr_text)
    metadata = extract_account_metadata(ocr_text)
    
    res = _fallback_text_line_parsing(ocr_text, job_id, detected_bank, metadata)
    res.ocrUsed = True
    res.documentType = "scanned_pdf"
    res.pageStatuses = page_statuses
    return res

def process_image_statement(
    file_path: str,
    job_id: Optional[str] = None,
    custom_mapping: Optional[Dict[str, str]] = None
) -> StatementExtractionResponse:
    """
    Processes standalone image statements (.png, .jpg, .jpeg, .tiff, .tif).
    """
    job_id = job_id or str(uuid.uuid4())

    if not check_tesseract_available():
        return StatementExtractionResponse(
            success=False,
            jobId=job_id,
            documentType="image",
            detectedBank="Image Statement (OCR Required)",
            statementPeriod=StatementPeriod(),
            summary=StatementSummary(),
            transactions=[],
            validation=StatementValidation(
                isValid=False,
                errors=["Tesseract OCR engine is not found on PATH or environment."],
                warnings=["Please install Tesseract OCR or upload PDF/Excel/CSV statements."],
                extractionQuality="NEEDS_REVIEW",
                overallConfidence=0.0
            ),
            ocrUsed=True,
            message="Tesseract OCR required for image parsing."
        )

    try:
        pil_img = Image.open(file_path)
        processed_img, est_conf = deskew_and_preprocess_image(pil_img)
        text = pytesseract.image_to_string(processed_img, lang=settings.OCR_LANGUAGE)
    except Exception as e:
        return StatementExtractionResponse(
            success=False,
            jobId=job_id,
            documentType="image",
            detectedBank="Image",
            statementPeriod=StatementPeriod(),
            summary=StatementSummary(),
            transactions=[],
            validation=StatementValidation(isValid=False, errors=[f"Image extraction error: {str(e)}"], extractionQuality="LOW"),
            ocrUsed=True
        )

    from app.processors.pdf_processor import _fallback_text_line_parsing
    detected_bank, conf = detect_bank_from_text(text)
    metadata = extract_account_metadata(text)

    res = _fallback_text_line_parsing(text, job_id, detected_bank, metadata)
    res.ocrUsed = True
    res.documentType = "image"
    res.pageStatuses = [PageProcessingStatus(pageNumber=1, status="OCR_USED", confidence=est_conf, hasImages=True)]
    return res
