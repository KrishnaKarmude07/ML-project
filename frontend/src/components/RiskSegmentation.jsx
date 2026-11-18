import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  Activity, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { fetchRiskSegmentation } from '../services/api';
import { formatInr } from '../utils/currency';

export default function RiskSegmentation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [viewAxis, setViewAxis] = useState('bmi');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchRiskSegmentation();
        setData(res);
        if (res.clusters && res.clusters.length > 0) {
          setSelectedCluster(res.clusters[0]);
        }
      } catch (err) {
        setError(err.message || 'Unable to load risk segmentation.');
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
        <span>Computing K-Means Unsupervised Actuarial Clusters...</span>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{error}</div>;
  }

  const clusters = data?.clusters || [];
  const scatterPoints = data?.scatter_points || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>Unsupervised Risk Segmentation Engine (K-Means, k=3)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Partitioning policyholders into distinct risk tiers based on multidimensional feature geometry: Age, BMI, Children, Smoking Status, and Claim Severity.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
            Total Analyzed: {data?.total_samples?.toLocaleString() || 2000} Policies
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {clusters.map((c) => {
          const isSelected = selectedCluster?.cluster_id === c.cluster_id;
          return (
            <div
              key={c.cluster_id}
              onClick={() => setSelectedCluster(c)}
              className={`rounded-2xl p-5 border cursor-pointer transition relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-slate-500 shadow-xl ring-2'
                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
              }`}
              style={{
                ringColor: isSelected ? c.color : 'transparent'
              }}
            >
              <div 
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none opacity-20"
                style={{ backgroundColor: c.color }}
              />

              <div className="flex justify-between items-start mb-3">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  style={{ 
                    color: c.color,
                    borderColor: `${c.color}60`,
                    backgroundColor: `${c.color}15`
                  }}
                >
                  {c.risk_tier}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {c.percentage}% of Book
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{c.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">{c.description}</p>

              <div className="space-y-2 pt-2 border-t border-slate-700/60 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mean Claim Payout:</span>
                  <span className="font-bold text-white font-mono">
                    {formatInr(c.avg_charges)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Median Claim:</span>
                  <span className="font-bold text-slate-300 font-mono">
                    {formatInr(c.median_charges)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Smoker Proportion:</span>
                  <span className={`font-bold font-mono ${c.smoker_percentage > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {c.smoker_percentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mean BMI / Age:</span>
                  <span className="font-mono text-slate-300">
                    {c.avg_bmi} / {c.avg_age} yrs
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCluster && (
        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-700/60">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400">Deep Dive Profile</span>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2 mt-0.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCluster.color }}></span>
                <span>{selectedCluster.name}</span>
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono">
              Sample Count: {selectedCluster.count} Policyholders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Actuarial Risk Drivers
              </h4>
              <ul className="space-y-2">
                {selectedCluster.key_drivers.map((driver, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Underwriting & Portfolio Guidance
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                {selectedCluster.cluster_id === 0 && (
                  "Standard underwriting pathway. Low capital reserve allocation required. Competitive pricing strategies can be deployed without threatening solvency margins."
                )}
                {selectedCluster.cluster_id === 1 && (
                  "Treat as an intermediate model segment for portfolio review. Validate cohort-level pricing and reserve actions against your organization's claims experience."
                )}
                {selectedCluster.cluster_id === 2 && (
                  "Treat as a higher-severity model segment for portfolio review. Validate any underwriting or reserve actions against your organization's approved policy and claims experience."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-700/60">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Actuarial Risk Scatter Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing the non-linear separation between clusters across clinical attributes and claim payouts.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Horizontal Axis:</span>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewAxis('bmi')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewAxis === 'bmi' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                BMI vs Claims
              </button>
              <button
                onClick={() => setViewAxis('age')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewAxis === 'age' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Age vs Claims
              </button>
            </div>
          </div>
        </div>

        <div className="h-72 w-full bg-slate-950/70 border border-slate-800/80 rounded-xl relative p-4 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-3 left-4 text-[10px] text-slate-500 font-mono">
            Annual Claim Payout (INR) &uarr;
          </div>
          <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 font-mono">
            {viewAxis === 'bmi' ? 'BMI Body Mass Index &rarr;' : 'Age (Years) &rarr;'}
          </div>

          <div className="absolute inset-0 p-8 flex items-end">
            <div className="w-full h-full relative">
              {scatterPoints.length > 0 ? (
                scatterPoints.map((pt, idx) => {
                  const xVal = viewAxis === 'bmi' ? (pt.bmi - 15) / (55 - 15) : (pt.age - 18) / (65 - 18);
                  const yVal = Math.min(1, Math.max(0, pt.charges / 65000));
                  return (
                    <div
                      key={idx}
                      title={`${pt.cluster_name} | Claim: ${formatInr(pt.charges)} | BMI: ${pt.bmi} | Age: ${pt.age} | Smoker: ${pt.smoker}`}
                      className="absolute w-2 h-2 rounded-full cursor-pointer transition transform hover:scale-150 hover:z-20 opacity-75"
                      style={{
                        left: `${xVal * 95}%`,
                        bottom: `${yVal * 90}%`,
                        backgroundColor: pt.color
                      }}
                    />
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-500">
                  Generating interactive cluster scatter points...
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-3 right-4 flex items-center space-x-3 text-[11px] bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Low Risk</span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Moderate Risk</span>
            </span>
            <span className="flex items-center space-x-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span>Critical High Risk</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
