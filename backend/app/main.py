import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any

from .schemas import (
    PolicyholderInput,
    PredictionResult,
    ModelsEvaluationResponse,
    RiskSegmentationResponse,
    DatasetSummaryResponse,
    PortfolioBatchRequest,
    PortfolioSummary
)
from .data_generator import get_or_create_dataset
from .ml_engine import ActuarialMLEngine

engine = ActuarialMLEngine()
logger = logging.getLogger("actuariaai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    df = get_or_create_dataset()
    engine.train_models(df)
    yield

app = FastAPI(
    title="ActuariaAI — Insurance Claim Amount Prediction & Risk Segmentation System",
    description="Offline Actuarial Intelligence System serving Ridge, Random Forest, Gradient Boosting with Quantile Bounds, and K-Means Clustering.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health & Status"])
async def root() -> Dict[str, Any]:
    return {
        "system": "ActuariaAI",
        "status": "online",
        "offline_mode": True,
        "models_ready": engine.is_trained,
        "sample_size": len(engine.df) if engine.df is not None else 0
    }

@app.get("/api/v1/health", tags=["Health & Status"])
async def health_check() -> Dict[str, Any]:
    return {
        "status": "ready" if engine.is_trained else "starting",
        "dataset_loaded": engine.df is not None,
        "models_trained": engine.is_trained,
        "available_algorithms": [
            "Ridge Regression",
            "Random Forest Regressor",
            "Gradient Boosting Regressor (Quantile 0.05/0.95)",
            "K-Means Clustering (3 Clusters)"
        ]
    }

@app.post("/api/v1/predict", response_model=PredictionResult, tags=["Actuarial Prediction"])
async def predict_claim(payload: PolicyholderInput):
    if not engine.is_trained:
        raise HTTPException(status_code=503, detail="Models are not yet ready")
    try:
        return engine.predict_policyholder(payload)
    except Exception as exc:
        logger.exception("Actuarial prediction failed")
        raise HTTPException(status_code=500, detail="Actuarial prediction failed") from exc

@app.get("/api/v1/models", response_model=ModelsEvaluationResponse, tags=["Model Evaluation & Governance"])
async def get_models_metrics():
    if not engine.is_trained:
        raise HTTPException(status_code=503, detail="Models are not yet ready")
    return engine.get_models_evaluation()

@app.get("/api/v1/segmentation", response_model=RiskSegmentationResponse, tags=["Risk Segmentation"])
async def get_risk_segmentation():
    if not engine.is_trained:
        raise HTTPException(status_code=503, detail="Models are not yet ready")
    return engine.get_risk_segmentation()

@app.get("/api/v1/dataset", response_model=DatasetSummaryResponse, tags=["Actuarial Data Explorer"])
async def get_dataset_summary():
    if not engine.is_trained:
        raise HTTPException(status_code=503, detail="Models are not yet ready")
    return engine.get_dataset_summary()

@app.post("/api/v1/portfolio/simulate", response_model=PortfolioSummary, tags=["Portfolio Actuarial Simulation"])
async def simulate_portfolio(payload: PortfolioBatchRequest):
    if not engine.is_trained:
        raise HTTPException(status_code=503, detail="Models are not yet ready")
    return engine.process_portfolio(payload.policies)

@app.get("/api/v1/actuarial/underwriting-rules", tags=["Underwriting Guidelines"])
async def get_underwriting_guidelines():
    return {
        "underwriting_rules": [
            {
                "id": "RULE-01",
                "category": "Smoker Surcharge",
                "condition": "smoker == 'yes'",
                "action": "Smoking status is a major claim-severity driver in this synthetic model. Review the model estimate and upper quantile bound during underwriting.",
                "severity": "High"
            },
            {
                "id": "RULE-02",
                "category": "Compounding Comorbidity Multiplier",
                "condition": "smoker == 'yes' and bmi >= 30.0",
                "action": "The synthetic severity generator applies an exponential BMI-related claim increase above this threshold. Use the model's upper quantile estimate for scenario reserve analysis; no fixed multiplier is applied.",
                "severity": "Critical"
            },
            {
                "id": "RULE-03",
                "category": "BMI Tipping Point Threshold",
                "condition": "bmi >= 35.0 (Class II/III Obesity)",
                "action": "Flag this profile for review under the organization's own underwriting and reserve policies.",
                "severity": "Medium"
            },
            {
                "id": "RULE-04",
                "category": "Senior Cohort Reserve",
                "condition": "age >= 55",
                "action": "Review age-related claim severity and reserve exposure using the model estimate.",
                "severity": "Medium"
            }
        ],
        "reserve_methodology": {
            "formula": "Statutory Payout Reserve = Point Claim Estimate (GBM) + [Upper 95% Bound - Point Claim Estimate]",
            "confidence_interval": "90% Double Quantile Gradient Boosting (alpha=0.05 to alpha=0.95)"
        }
    }
