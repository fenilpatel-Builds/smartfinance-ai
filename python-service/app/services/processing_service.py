import uuid
from typing import Dict, Any, Optional
from app.schemas.statement_schema import StatementExtractionResponse
from app.services.extraction_service import extract_statement

# In-memory job store for asynchronous processing status tracking
JOBS: Dict[str, Dict[str, Any]] = {}

def create_job() -> str:
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        "jobId": job_id,
        "status": "PENDING", # PENDING | PROCESSING | COMPLETED | FAILED
        "progress": 0,
        "result": None,
        "error": None
    }
    return job_id

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    return JOBS.get(job_id)

def execute_extraction_job(
    job_id: str,
    file_path: str,
    custom_mapping: Optional[Dict[str, str]] = None
) -> StatementExtractionResponse:
    if job_id not in JOBS:
        JOBS[job_id] = {"jobId": job_id, "status": "PROCESSING", "progress": 10, "result": None, "error": None}
    else:
        JOBS[job_id]["status"] = "PROCESSING"
        JOBS[job_id]["progress"] = 30

    try:
        response = extract_statement(file_path, job_id, custom_mapping)
        JOBS[job_id]["status"] = "COMPLETED" if response.success else "FAILED"
        JOBS[job_id]["progress"] = 100
        JOBS[job_id]["result"] = response.model_dump()
        return response
    except Exception as e:
        JOBS[job_id]["status"] = "FAILED"
        JOBS[job_id]["progress"] = 100
        JOBS[job_id]["error"] = str(e)
        raise e

