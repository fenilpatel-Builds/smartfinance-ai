import os
import shutil
import tempfile
import uuid
from typing import Optional, Dict
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.config import settings
from app.services.processing_service import create_job, get_job, execute_extraction_job
from app.schemas.statement_schema import StatementExtractionResponse

router = APIRouter(prefix="/api/v1")

class ProcessStatementRequest(BaseModel):
    filePath: str
    customMapping: Optional[Dict[str, str]] = None
    jobId: Optional[str] = None

@router.post("/process-statement", response_model=StatementExtractionResponse)
async def process_statement(
    payload: ProcessStatementRequest,
    x_service_secret: Optional[str] = Header(None)
):
    if x_service_secret and x_service_secret != settings.SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized service token")

    job_id = payload.jobId or create_job()
    result = execute_extraction_job(job_id, payload.filePath, payload.customMapping)
    return result

@router.post("/upload-and-process", response_model=StatementExtractionResponse)
async def upload_and_process(
    file: UploadFile = File(...),
    customMappingJson: Optional[str] = Form(None),
    x_service_secret: Optional[str] = Header(None)
):
    if x_service_secret and x_service_secret != settings.SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized service token")

    job_id = create_job()
    
    # Save uploaded file to temp file
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    import json
    mapping = None
    if customMappingJson:
        try:
            mapping = json.loads(customMappingJson)
        except Exception:
            pass

    try:
        result = execute_extraction_job(job_id, tmp_path, mapping)
        return result
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

@router.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

