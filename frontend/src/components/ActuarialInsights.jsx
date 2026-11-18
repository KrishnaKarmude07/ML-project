import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck2, 
  Scale, 
  HelpCircle,
  Binary
} from 'lucide-react';
import { fetchUnderwritingRules } from '../services/api';

export default function ActuarialInsights() {
  const [rulesData, setRulesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchUnderwritingRules();
        setRulesData(res);
      } catch (err) {
        setError(err.message || 'Unable to load underwriting guidance.');
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
        <span>Loading underwriting guidance...</span>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{error}</div>;
  }

  const rules = rulesData?.underwriting_rules || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <span>Illustrative Underwriting Guidelines & Reserve Framework</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standardized operational policies for actuarial pricing, capital reserve allocations, and comorbidity risk mitigation.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Illustrative Model Guidance</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rules.map((rule) => {
          const isCritical = rule.severity === 'Critical';
          const isHigh = rule.severity === 'High';
          return (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl border transition ${
                isCritical
                  ? 'bg-red-950/20 border-red-500/40'
                  : isHigh
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-slate-800/50 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono font-bold text-sky-400">
                  {rule.id}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isCritical ? 'bg-red-500/20 text-red-300' : isHigh ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {rule.severity} Severity
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">{rule.category}</h3>
              <div className="my-2 p-2 rounded-lg bg-slate-900/80 font-mono text-xs text-slate-300 border border-slate-800">
                Condition: <span className="text-sky-300">{rule.condition}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">{rule.action}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2 pb-3 border-b border-slate-700/60">
          <Binary className="w-4 h-4 text-sky-400" />
          <span>Actuarial Mathematics & Loss Function Specification</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-sky-400 block uppercase">
              Asymmetric Pinball Quantile Loss
            </span>
            <p className="text-xs text-slate-400">
              For quantile bounds (alpha=0.05 and alpha=0.95), the loss function penalizes under-predictions by alpha and over-predictions by (1 - alpha), generating exact empirical percentiles.
            </p>
            <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-sky-300">
              L_alpha(y, y_hat) = max(alpha*(y - y_hat), (1 - alpha)*(y_hat - y))
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-emerald-400 block uppercase">
              K-Means Risk Clustering Objective
            </span>
            <p className="text-xs text-slate-400">
              Minimizes within-cluster sum of squares across standardized clinical attributes and claim payouts to isolate distinct risk severity pools.
            </p>
            <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-emerald-300">
              J = sum_k sum_i || x_i - mu_k ||^2
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 block uppercase">
              Statutory Tail Capital Reserve
            </span>
            <p className="text-xs text-slate-400">
              Calculated as the difference between the 95th percentile quantile bound and the point prediction, ensuring adequate buffer for tail event solvency.
            </p>
            <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-amber-300">
              Reserve_Req = y_hat(P95) - y_hat(Point)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
