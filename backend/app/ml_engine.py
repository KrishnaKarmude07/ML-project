import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.cluster import KMeans
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error, root_mean_squared_error, silhouette_score

from .schemas import (
    PolicyholderInput,
    PredictionResult,
    FeatureImpact,
    ModelMetric,
    ModelsEvaluationResponse,
    ClusteringEvaluation,
    ClusterProfile,
    RiskSegmentationResponse,
    DatasetSummaryResponse,
    PortfolioSummary
)

class ActuarialMLEngine:
    def __init__(self):
        self.df: pd.DataFrame = None
        self.preprocessor: ColumnTransformer = None
        self.feature_names: List[str] = []
        
        self.ridge_model: Ridge = None
        self.rf_model: RandomForestRegressor = None
        self.gb_model: GradientBoostingRegressor = None
        self.gb_lower: GradientBoostingRegressor = None
        self.gb_upper: GradientBoostingRegressor = None
        
        self.kmeans: KMeans = None
        self.kmeans_scaler: StandardScaler = None
        self.cluster_order_map: Dict[int, int] = {}
        self.cluster_profiles: List[ClusterProfile] = []
        self.clustering_evaluation: ClusteringEvaluation = None
        self.clustering_feature_names = ['age', 'bmi', 'children', 'smoker', 'charges']
        
        self.metrics: Dict[str, ModelMetric] = {}
        self.feature_importances: Dict[str, float] = {}
        self.is_trained: bool = False
        
        self.train_count: int = 0
        self.test_count: int = 0

    def prepare_data(self, df: pd.DataFrame):
        self.df = df.copy()
        
        X = self.df[['age', 'sex', 'bmi', 'children', 'smoker', 'region']]
        y = self.df['charges']
        
        numeric_features = ['age', 'bmi', 'children']
        categorical_features = ['sex', 'smoker', 'region']
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                ('cat', OneHotEncoder(drop='first', sparse_output=False), categorical_features)
            ]
        )
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.train_count = len(X_train)
        self.test_count = len(X_test)
        
        X_train_trans = self.preprocessor.fit_transform(X_train)
        X_test_trans = self.preprocessor.transform(X_test)
        
        cat_encoder = self.preprocessor.named_transformers_['cat']
        cat_names = cat_encoder.get_feature_names_out(categorical_features).tolist()
        self.feature_names = numeric_features + cat_names
        
        return X_train_trans, X_test_trans, y_train, y_test

    def train_models(self, df: pd.DataFrame):
        X_train_trans, X_test_trans, y_train, y_test = self.prepare_data(df)
        
        self.ridge_model = Ridge(alpha=1.0)
        self.ridge_model.fit(X_train_trans, y_train)
        
        self.rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=4,
            random_state=42,
            n_jobs=1
        )
        self.rf_model.fit(X_train_trans, y_train)
        
        self.gb_model = GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            random_state=42,
            loss='squared_error'
        )
        self.gb_model.fit(X_train_trans, y_train)
        
        self.gb_lower = GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            random_state=42,
            loss='quantile',
            alpha=0.05
        )
        self.gb_lower.fit(X_train_trans, y_train)
        
        self.gb_upper = GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            random_state=42,
            loss='quantile',
            alpha=0.95
        )
        self.gb_upper.fit(X_train_trans, y_train)
        
        self.evaluate_regressors(X_test_trans, y_test)
        self.train_risk_segmentation()
        
        importances = self.gb_model.feature_importances_
        importance_dict = {name: round(float(imp), 4) for name, imp in zip(self.feature_names, importances)}
        self.feature_importances = dict(sorted(importance_dict.items(), key=lambda item: item[1], reverse=True))
        
        self.is_trained = True

    def calculate_metrics(self, y_true, y_pred, name: str, display: str, family: str, primary: bool = False) -> ModelMetric:
        r2 = round(float(r2_score(y_true, y_pred)), 4)
        mae = round(float(mean_absolute_error(y_true, y_pred)), 2)
        try:
            rmse = round(float(root_mean_squared_error(y_true, y_pred)), 2)
        except Exception:
            rmse = round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 2)
        mape = round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100), 2)
        
        return ModelMetric(
            model_name=name,
            display_name=display,
            algorithm_family=family,
            r2=r2,
            mae=mae,
            rmse=rmse,
            mape=mape,
            is_production_primary=primary
        )

    def evaluate_regressors(self, X_test_trans, y_test):
        ridge_pred = self.ridge_model.predict(X_test_trans)
        rf_pred = self.rf_model.predict(X_test_trans)
        gb_pred = self.gb_model.predict(X_test_trans)
        
        self.metrics['ridge'] = self.calculate_metrics(
            y_test, ridge_pred, 'ridge', 'Ridge Regression', 'L2-Regularized Linear Model', False
        )
        self.metrics['random_forest'] = self.calculate_metrics(
            y_test, rf_pred, 'random_forest', 'Random Forest Regressor', 'Variance-Reduced Bagging Ensemble', False
        )
        self.metrics['gradient_boosting'] = self.calculate_metrics(
            y_test, gb_pred, 'gradient_boosting', 'Gradient Boosting Regressor', 'Sequential Gradient Boosted Trees (Primary)', True
        )

    def train_risk_segmentation(self):
        clustering_df = self.df.copy()
        clustering_df['smoker_num'] = clustering_df['smoker'].apply(lambda x: 1 if x == 'yes' else 0)
        clustering_features = clustering_df[['age', 'bmi', 'children', 'smoker_num', 'charges']].values
        
        self.kmeans_scaler = StandardScaler()
        clustering_scaled = self.kmeans_scaler.fit_transform(clustering_features)
        
        self.kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        raw_labels = self.kmeans.fit_predict(clustering_scaled)
        self.clustering_evaluation = ClusteringEvaluation(
            algorithm_name='K-Means Clustering',
            cluster_count=3,
            silhouette_score=round(float(silhouette_score(clustering_scaled, raw_labels)), 4),
            inertia=round(float(self.kmeans.inertia_), 2),
            sample_count=len(clustering_df),
            feature_names=self.clustering_feature_names
        )
        
        clustering_df['raw_cluster'] = raw_labels
        means = clustering_df.groupby('raw_cluster')['charges'].mean().sort_values()
        
        self.cluster_order_map = {old_label: new_rank for new_rank, old_label in enumerate(means.index)}
        clustering_df['ordered_cluster'] = clustering_df['raw_cluster'].map(self.cluster_order_map)
        
        cluster_defs = [
            {
                'name': 'Low Risk (Standard Cohort)',
                'risk_tier': 'Tier 1 - Standard Low Risk',
                'color': '#10b981',
                'description': 'Predominantly non-smokers with standard BMI ranges. Low medical utilization baseline.',
                'key_drivers': ['Non-smoker', 'Standard BMI', 'Predictable baseline healthcare costs']
            },
            {
                'name': 'Moderate Risk (Elevated Cohort)',
                'risk_tier': 'Tier 2 - Moderate / Mid-Severity',
                'color': '#f59e0b',
                'description': 'Older demographic and non-smokers with elevated BMI (overweight to class I obesity).',
                'key_drivers': ['Aging demographic factor', 'Elevated BMI > 28', 'Moderate chronic care overhead']
            },
            {
                'name': 'Severe High Risk (Critical Cohort)',
                'risk_tier': 'Tier 3 - Critical High Severity',
                'color': '#ef4444',
                'description': 'Active smokers combined with elevated BMI (>= 30). High probability of exponential claim spikes.',
                'key_drivers': ['Active smoking status', 'Obesity threshold interaction (BMI >= 30)', 'Substantial inpatient risk']
            }
        ]
        
        total_len = len(clustering_df)
        self.cluster_profiles = []
        for i in range(3):
            sub = clustering_df[clustering_df['ordered_cluster'] == i]
            count = len(sub)
            meta = cluster_defs[i]
            
            profile = ClusterProfile(
                cluster_id=i,
                name=meta['name'],
                risk_tier=meta['risk_tier'],
                color=meta['color'],
                count=count,
                percentage=round(float((count / total_len) * 100), 1),
                avg_age=round(float(sub['age'].mean()), 1),
                avg_bmi=round(float(sub['bmi'].mean()), 2),
                avg_children=round(float(sub['children'].mean()), 2),
                smoker_percentage=round(float((sub['smoker_num'].mean()) * 100), 1),
                avg_charges=round(float(sub['charges'].mean()), 2),
                median_charges=round(float(sub['charges'].median()), 2),
                description=meta['description'],
                key_drivers=meta['key_drivers']
            )
            self.cluster_profiles.append(profile)

    def predict_policyholder(self, inp: PolicyholderInput) -> PredictionResult:
        row_df = pd.DataFrame([{
            'age': inp.age,
            'sex': inp.sex,
            'bmi': inp.bmi,
            'children': inp.children,
            'smoker': inp.smoker,
            'region': inp.region
        }])
        
        row_trans = self.preprocessor.transform(row_df)
        
        gb_val = max(1121.87, round(float(self.gb_model.predict(row_trans)[0]), 2))
        lower_val = min(gb_val, max(900.0, round(float(self.gb_lower.predict(row_trans)[0]), 2)))
        upper_val = max(gb_val, lower_val, round(float(self.gb_upper.predict(row_trans)[0]), 2))
        
        ridge_val = max(1121.87, round(float(self.ridge_model.predict(row_trans)[0]), 2))
        rf_val = max(1121.87, round(float(self.rf_model.predict(row_trans)[0]), 2))
        
        smoker_num = 1 if inp.smoker == 'yes' else 0
        cluster_feature_vec = np.array([[inp.age, inp.bmi, inp.children, smoker_num, gb_val]])
        cluster_scaled = self.kmeans_scaler.transform(cluster_feature_vec)
        raw_cluster = int(self.kmeans.predict(cluster_scaled)[0])
        ordered_cluster = self.cluster_order_map.get(raw_cluster, 0)
        
        profile = self.cluster_profiles[ordered_cluster]
        
        base_rate = round(2450.0 + (inp.age * 242.0) + (inp.children * 475.0), 2)
        safety_reserve = round(max(500.0, upper_val - gb_val), 2)
        smoker_surcharge = (inp.smoker == 'yes')
        
        if inp.bmi < 25.0:
            bmi_multiplier = 1.0
        elif inp.bmi < 30.0:
            bmi_multiplier = 1.15
        elif inp.bmi < 35.0:
            bmi_multiplier = 1.45
        else:
            bmi_multiplier = 1.85
            
        feature_impacts = self.compute_feature_impacts(inp, gb_val)
        
        return PredictionResult(
            point_prediction=gb_val,
            lower_bound_90ci=lower_val,
            upper_bound_90ci=upper_val,
            confidence_interval_width=round(upper_val - lower_val, 2),
            ridge_prediction=ridge_val,
            rf_prediction=rf_val,
            gb_prediction=gb_val,
            risk_cluster=ordered_cluster,
            risk_label=profile.name,
            risk_tier=profile.risk_tier,
            risk_description=profile.description,
            risk_color=profile.color,
            actuarial_base_rate=base_rate,
            recommended_safety_reserve=safety_reserve,
            smoker_surcharge_applied=smoker_surcharge,
            bmi_risk_multiplier=round(bmi_multiplier, 2),
            feature_impacts=feature_impacts
        )

    def compute_feature_impacts(self, inp: PolicyholderInput, gb_val: float) -> List[FeatureImpact]:
        baseline_charge = 3200.0
        diff = max(100.0, gb_val - baseline_charge)
        
        smoker_contrib = 18000.0 if inp.smoker == 'yes' else 0.0
        if inp.smoker == 'yes' and inp.bmi >= 30.0:
            smoker_contrib += 12000.0
            
        bmi_contrib = max(0.0, (inp.bmi - 22.0) * 280.0)
        age_contrib = max(0.0, (inp.age - 18.0) * 265.0)
        children_contrib = inp.children * 500.0
        
        region_mult = {'southeast': 450.0, 'northeast': 250.0, 'northwest': -150.0, 'southwest': -250.0}
        region_contrib = region_mult.get(inp.region, 0.0)
        
        total_raw = smoker_contrib + bmi_contrib + age_contrib + children_contrib + abs(region_contrib) + 500.0
        
        impacts = [
            FeatureImpact(
                feature='Smoking Status',
                impact_value=round(smoker_contrib, 2),
                direction='increase' if inp.smoker == 'yes' else 'neutral',
                percentage_contribution=round((smoker_contrib / total_raw) * 100, 1)
            ),
            FeatureImpact(
                feature='BMI Body Mass Index',
                impact_value=round(bmi_contrib, 2),
                direction='increase' if inp.bmi > 25.0 else 'neutral',
                percentage_contribution=round((bmi_contrib / total_raw) * 100, 1)
            ),
            FeatureImpact(
                feature='Age Progression',
                impact_value=round(age_contrib, 2),
                direction='increase' if inp.age > 25 else 'neutral',
                percentage_contribution=round((age_contrib / total_raw) * 100, 1)
            ),
            FeatureImpact(
                feature='Dependent Children',
                impact_value=round(children_contrib, 2),
                direction='increase' if inp.children > 0 else 'neutral',
                percentage_contribution=round((children_contrib / total_raw) * 100, 1)
            ),
            FeatureImpact(
                feature='Geographic Region Cost Factor',
                impact_value=round(region_contrib, 2),
                direction='increase' if region_contrib > 0 else ('decrease' if region_contrib < 0 else 'neutral'),
                percentage_contribution=round((abs(region_contrib) / total_raw) * 100, 1)
            )
        ]
        
        return sorted(impacts, key=lambda x: x.percentage_contribution, reverse=True)

    def get_models_evaluation(self) -> ModelsEvaluationResponse:
        model_list = [
            self.metrics['gradient_boosting'],
            self.metrics['random_forest'],
            self.metrics['ridge']
        ]
        
        return ModelsEvaluationResponse(
            models=model_list,
            clustering=self.clustering_evaluation,
            best_model_name='Gradient Boosting Regressor',
            training_sample_count=self.train_count,
            test_sample_count=self.test_count,
            feature_names=self.feature_names,
            feature_importances=self.feature_importances
        )

    def get_risk_segmentation(self) -> RiskSegmentationResponse:
        sub_sample = self.df.sample(min(350, len(self.df)), random_state=42).copy()
        sub_sample['smoker_num'] = sub_sample['smoker'].apply(lambda x: 1 if x == 'yes' else 0)
        
        points = []
        for _, row in sub_sample.iterrows():
            feat = np.array([[row['age'], row['bmi'], row['children'], row['smoker_num'], row['charges']]])
            scaled = self.kmeans_scaler.transform(feat)
            raw_c = int(self.kmeans.predict(scaled)[0])
            ord_c = self.cluster_order_map.get(raw_c, 0)
            
            points.append({
                'age': int(row['age']),
                'bmi': float(row['bmi']),
                'charges': float(row['charges']),
                'smoker': str(row['smoker']),
                'cluster_id': ord_c,
                'cluster_name': self.cluster_profiles[ord_c].name,
                'color': self.cluster_profiles[ord_c].color
            })
            
        return RiskSegmentationResponse(
            clusters=self.cluster_profiles,
            total_samples=len(self.df),
            scatter_points=points
        )

    def get_dataset_summary(self) -> DatasetSummaryResponse:
        total = len(self.df)
        charges = self.df['charges']
        
        smokers_df = self.df[self.df['smoker'] == 'yes']
        nonsmokers_df = self.df[self.df['smoker'] == 'no']
        
        smoker_obese = self.df[(self.df['smoker'] == 'yes') & (self.df['bmi'] >= 30.0)]['charges'].mean()
        smoker_non_obese = self.df[(self.df['smoker'] == 'yes') & (self.df['bmi'] < 30.0)]['charges'].mean()
        nonsmoker_obese = self.df[(self.df['smoker'] == 'no') & (self.df['bmi'] >= 30.0)]['charges'].mean()
        nonsmoker_non_obese = self.df[(self.df['smoker'] == 'no') & (self.df['bmi'] < 30.0)]['charges'].mean()
        
        age_bins = [18, 30, 40, 50, 65]
        age_labels = ['18-29', '30-39', '40-49', '50-64']
        age_binned = pd.cut(self.df['age'], bins=age_bins, labels=age_labels, right=False)
        age_dist = []
        for lab in age_labels:
            sub = self.df[age_binned == lab]
            age_dist.append({
                'bracket': lab,
                'count': len(sub),
                'avg_charges': round(float(sub['charges'].mean()), 2)
            })
            
        bmi_bins = [15, 25, 30, 35, 60]
        bmi_labels = ['Normal (<25)', 'Overweight (25-30)', 'Obese I (30-35)', 'Severe Obese (>35)']
        bmi_binned = pd.cut(self.df['bmi'], bins=bmi_bins, labels=bmi_labels, right=False)
        bmi_dist = []
        for lab in bmi_labels:
            sub = self.df[bmi_binned == lab]
            bmi_dist.append({
                'bracket': lab,
                'count': len(sub),
                'avg_charges': round(float(sub['charges'].mean()), 2)
            })
            
        charge_bins = [0, 5000, 10000, 20000, 35000, 100000]
        charge_labels = ['$0-5k', '$5k-10k', '$10k-20k', '$20k-35k', '$35k+']
        charge_binned = pd.cut(self.df['charges'], bins=charge_bins, labels=charge_labels, right=False)
        charge_dist = []
        for lab in charge_labels:
            sub = self.df[charge_binned == lab]
            charge_dist.append({
                'range': lab,
                'count': len(sub),
                'percentage': round(float((len(sub) / total) * 100), 1)
            })
            
        reg_dist = self.df['region'].value_counts().to_dict()
        preview = self.df.to_dict(orient='records')
        
        return DatasetSummaryResponse(
            total_records=total,
            columns=list(self.df.columns),
            avg_charge=round(float(charges.mean()), 2),
            median_charge=round(float(charges.median()), 2),
            std_charge=round(float(charges.std()), 2),
            min_charge=round(float(charges.min()), 2),
            max_charge=round(float(charges.max()), 2),
            smoker_count=len(smokers_df),
            nonsmoker_count=len(nonsmokers_df),
            smoker_avg_charge=round(float(smokers_df['charges'].mean()), 2),
            nonsmoker_avg_charge=round(float(nonsmokers_df['charges'].mean()), 2),
            bmi_over_30_smoker_avg=round(float(smoker_obese), 2),
            bmi_under_30_smoker_avg=round(float(smoker_non_obese), 2),
            bmi_over_30_nonsmoker_avg=round(float(nonsmoker_obese), 2),
            bmi_under_30_nonsmoker_avg=round(float(nonsmoker_non_obese), 2),
            distribution_age=age_dist,
            distribution_bmi=bmi_dist,
            distribution_charges=charge_dist,
            region_distribution=reg_dist,
            preview=preview
        )

    def process_portfolio(self, policies: List[PolicyholderInput]) -> PortfolioSummary:
        records = []
        total_expected = 0.0
        total_p95 = 0.0
        high_risk = 0
        moderate_risk = 0
        low_risk = 0
        smokers = 0
        
        for i, pol in enumerate(policies):
            res = self.predict_policyholder(pol)
            total_expected += res.point_prediction
            total_p95 += res.upper_bound_90ci
            
            if res.risk_cluster == 2:
                high_risk += 1
            elif res.risk_cluster == 1:
                moderate_risk += 1
            else:
                low_risk += 1
                
            if pol.smoker == 'yes':
                smokers += 1
                
            records.append({
                'policy_id': f"POL-{1001 + i}",
                'age': pol.age,
                'sex': pol.sex,
                'bmi': pol.bmi,
                'children': pol.children,
                'smoker': pol.smoker,
                'region': pol.region,
                'predicted_claim': res.point_prediction,
                'upper_bound_90ci': res.upper_bound_90ci,
                'risk_tier': res.risk_tier,
                'risk_color': res.risk_color
            })
            
        n = len(policies)
        avg_claim = round(total_expected / n, 2) if n > 0 else 0.0
        var_95 = round(max(0.0, total_p95 - total_expected), 2)
        
        return PortfolioSummary(
            total_policies=n,
            total_expected_claims=round(total_expected, 2),
            average_claim_per_policy=avg_claim,
            total_reserve_p95=round(total_p95, 2),
            value_at_risk_95=var_95,
            high_risk_policy_count=high_risk,
            moderate_risk_policy_count=moderate_risk,
            low_risk_policy_count=low_risk,
            smoker_count=smokers,
            policies=records
        )
