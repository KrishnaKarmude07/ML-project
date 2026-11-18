from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, List, Dict, Any


class APIModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class PolicyholderInput(APIModel):
    age: int = Field(..., ge=18, le=100, examples=[35])
    sex: Literal['male', 'female'] = Field(..., examples=['male'])
    bmi: float = Field(..., ge=10.0, le=65.0, examples=[28.5])
    children: int = Field(..., ge=0, le=10, examples=[1])
    smoker: Literal['yes', 'no'] = Field(..., examples=['no'])
    region: Literal['northeast', 'northwest', 'southeast', 'southwest'] = Field(..., examples=['northwest'])


class FeatureImpact(APIModel):
    feature: str
    impact_value: float
    direction: Literal['increase', 'decrease', 'neutral']
    percentage_contribution: float

class PredictionResult(APIModel):
    point_prediction: float
    lower_bound_90ci: float
    upper_bound_90ci: float
    confidence_interval_width: float
    ridge_prediction: float
    rf_prediction: float
    gb_prediction: float
    risk_cluster: int
    risk_label: str
    risk_tier: str
    risk_description: str
    risk_color: str
    actuarial_base_rate: float
    recommended_safety_reserve: float
    smoker_surcharge_applied: bool
    bmi_risk_multiplier: float
    feature_impacts: List[FeatureImpact]

class ModelMetric(APIModel):
    model_name: str
    display_name: str
    algorithm_family: str
    r2: float
    mae: float
    rmse: float
    mape: float
    is_production_primary: bool

class ClusteringEvaluation(APIModel):
    algorithm_name: str
    cluster_count: int
    silhouette_score: float
    inertia: float
    sample_count: int
    feature_names: List[str]


class ModelsEvaluationResponse(APIModel):
    models: List[ModelMetric]
    clustering: ClusteringEvaluation
    best_model_name: str
    training_sample_count: int
    test_sample_count: int
    feature_names: List[str]
    feature_importances: Dict[str, float]

class ClusterProfile(APIModel):
    cluster_id: int
    name: str
    risk_tier: str
    color: str
    count: int
    percentage: float
    avg_age: float
    avg_bmi: float
    avg_children: float
    smoker_percentage: float
    avg_charges: float
    median_charges: float
    description: str
    key_drivers: List[str]

class RiskSegmentationResponse(APIModel):
    clusters: List[ClusterProfile]
    total_samples: int
    scatter_points: List[Dict[str, Any]]

class DatasetSummaryResponse(APIModel):
    total_records: int
    columns: List[str]
    avg_charge: float
    median_charge: float
    std_charge: float
    min_charge: float
    max_charge: float
    smoker_count: int
    nonsmoker_count: int
    smoker_avg_charge: float
    nonsmoker_avg_charge: float
    bmi_over_30_smoker_avg: float
    bmi_under_30_smoker_avg: float
    bmi_over_30_nonsmoker_avg: float
    bmi_under_30_nonsmoker_avg: float
    distribution_age: List[Dict[str, Any]]
    distribution_bmi: List[Dict[str, Any]]
    distribution_charges: List[Dict[str, Any]]
    region_distribution: Dict[str, int]
    preview: List[Dict[str, Any]]

class PortfolioBatchRequest(APIModel):
    policies: List[PolicyholderInput] = Field(..., min_length=1, max_length=500)

class PortfolioSummary(APIModel):
    total_policies: int
    total_expected_claims: float
    average_claim_per_policy: float
    total_reserve_p95: float
    value_at_risk_95: float
    high_risk_policy_count: int
    moderate_risk_policy_count: int
    low_risk_policy_count: int
    smoker_count: int
    policies: List[Dict[str, Any]]
