import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  BarChart3, 
  Award, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight, 
  Info,
  Scale
} from 'lucide-react';
import { fetchModelsMetrics } from '../services/api';
import { formatInr } from '../utils/currency';

export default function ModelComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchModelsMetrics();
        setData(res);
      } catch (err) {
        setError(err.message || 'Unable to load model evaluation metrics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mr-3"></div>
        <span>Retrieving Actuarial Model Evaluation Metrics...</span>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{error}</div>;
  }

  const models = data?.models || [];
  const featureImportances = data?.feature_importances || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span>Actuarial Model Governance & Benchmark Comparison</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirical evaluation of 4 distinct algorithms trained on offline actuarial data using rigorous 80/20 train/test partitioning.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center space-x-1.5">
            <Award className="w-4 h-4" />
            <span>Production Primary: Gradient Boosting</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {models.map((m) => (
          <div
            key={m.model_name}
            className={`rounded-2xl p-5 border transition ${
              m.is_production_primary
                ? 'bg-slate-800/90 border-sky-500/50 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/30'
                : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block uppercase">
                  {m.algorithm_family}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{m.display_name}</h3>
              </div>
              {m.is_production_primary && (
                <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                  Primary
                </span>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">R² Determination Score</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {(m.r2 * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Mean Absolute Error (MAE)</span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatInr(m.mae)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Root Mean Squared Error (RMSE)</span>
                <span className="text-sm font-bold text-slate-300 font-mono">
                  {formatInr(m.rmse)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5">
                <span className="text-slate-400">MAPE Error Percentage</span>
                <span className="text-sm font-bold text-sky-400 font-mono">
                  {m.mape.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
              {m.model_name === 'gradient_boosting' && (
                <p>Equipped with dual quantile loss regressors (alpha=0.05 & alpha=0.95) to estimate a claim range.</p>
              )}
              {m.model_name === 'random_forest' && (
                <p>Bagging ensemble of 100 decision trees to mitigate high variance in regional sub-cohorts.</p>
              )}
              {m.model_name === 'ridge' && (
                <p>L2 Tikhonov regularized linear regression providing an interpretable parametric baseline.</p>
              )}
            </div>
          </div>
        ))}
        {data?.clustering && (
          <div className="rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-br from-slate-800/80 to-emerald-950/20">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block uppercase">
                  Unsupervised Segmentation Engine
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{data.clustering.algorithm_name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] uppercase">
                k = {data.clustering.cluster_count}
              </span>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Silhouette Score</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {data.clustering.silhouette_score.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Within-Cluster Inertia</span>
                <span className="text-sm font-bold text-white font-mono">
                  {data.clustering.inertia.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5">
                <span className="text-slate-400">Policies Segmented</span>
                <span className="text-sm font-bold text-slate-300 font-mono">
                  {data.clustering.sample_count.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
              Evaluated across {data.clustering.feature_names.join(', ')}.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Global Feature Importance Decomposition</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Gini Impurity / Loss Reduction</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(featureImportances).map(([feat, imp]) => {
              const pct = (imp * 100).toFixed(1);
              return (
                <div key={feat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium font-mono">{feat}</span>
                    <span className="text-sky-400 font-mono font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.max(2, parseFloat(pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-700/50">
            Feature importance values are calculated from the fitted Gradient Boosting model and are shown here for this training dataset.
          </p>
        </div>

        <div className="lg:col-span-5 bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Actuarial Governance Justification</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Model Evaluation
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
              <span className="font-semibold text-sky-400 block">Non-Linear Interaction Capture</span>
              <p className="text-slate-400 text-[11px]">
                Ridge provides a linear baseline and does not directly represent the generator's exponential BMI interaction. Gradient Boosting can learn this non-linear pattern from the synthetic training data.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
              <span className="font-semibold text-emerald-400 block">Quantile Safety Reserve Sizing</span>
              <p className="text-slate-400 text-[11px]">
                Pinball-loss quantile regressors at alpha=0.05 and alpha=0.95 provide a distribution-sensitive claim range. Estimates are illustrative and require calibration against an insurer's validated claims data before operational use.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
              <span className="font-semibold text-amber-400 block">Unsupervised Risk Segmentation Layer</span>
              <p className="text-slate-400 text-[11px]">
                K-Means clustering (n_clusters=3) operates orthogonally to regression, grouping policyholders into standard, elevated, and critical risk pools for underwriting guidelines and cohort-based premium adjustments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
