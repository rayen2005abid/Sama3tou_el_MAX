from fastapi import APIRouter, HTTPException, Depends
from forecasting.inference.service import inference_service

router = APIRouter(
    prefix="/forecast",
    tags=["forecast"]
)

@router.get("/predict/{ticker}")
async def get_forecast(ticker: str):
    """
    Get price forecast for a specific ticker using the optimized LSTM model.
    """
    try:
        result = inference_service.predict(ticker)
        if "error" in result:
             raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
