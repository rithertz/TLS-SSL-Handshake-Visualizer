from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.analysis_service import analyze_url
from app.services.url_validator import URLValidationError


router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    try:
        return analyze_url(request.url)

    except URLValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to analyze the target: {error}",
        )
