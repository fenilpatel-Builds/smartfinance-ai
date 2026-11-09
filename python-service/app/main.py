import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import health, processing, extraction
from app.config import settings

app = FastAPI(
    title="SmartFinance AI - Processing Service",
    description="Python FastAPI document extraction, OCR, and financial statement normalization service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(processing.router)
app.include_router(extraction.router)

@app.get("/")
def root():
    return {
        "message": "SmartFinance AI Python Processing Service is running.",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

