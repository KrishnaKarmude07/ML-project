import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Play, 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  BarChart, 
  Download,
  RefreshCw
} from 'lucide-react';
import { simulatePortfolioBatch } from '../services/api';
import { formatInr } from '../utils/currency';

export default function PortfolioSimulator() {
  const [cohortType, setCohortType] = useState('balanced');
  const [portfolioSize, setPortfolioSize] = useState(25);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCohort = (type, count) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      let age, smoker, bmi, children, region;
      
      if (type === 'young_healthy') {
        age = Math.floor(Math.random() * 15) + 20;
        smoker = Math.random() < 0.05 ? 'yes' : 'no';
        bmi = Math.round((Math.random() * 8 + 19) * 10) / 10;
        children = Math.floor(Math.random() * 2);
      } else if (type === 'senior_cohort') {
        age = Math.floor(Math.random() * 15) + 50;
        smoker = Math.random() < 0.18 ? 'yes' : 'no';
        bmi = Math.round((Math.random() * 14 + 24) * 10) / 10;
        children = Math.floor(Math.random() * 3);
      } else if (type === 'adverse_stress') {
        age = Math.floor(Math.random() * 30) + 30;
        smoker = Math.random() < 0.65 ? 'yes' : 'no';
        bmi = Math.round((Math.random() * 18 + 28) * 10) / 10;
        children = Math.floor(Math.random() * 4);
      } else {
        age = Math.floor(Math.random() * 45) + 19;
        smoker = Math.random() < 0.20 ? 'yes' : 'no';
        bmi = Math.round((Math.random() * 20 + 20) * 10) / 10;
        children = Math.floor(Math.random() * 4);
      }
      
      const regions = ['northeast', 'northwest', 'southeast', 'southwest'];
      region = regions[Math.floor(Math.random() * regions.length)];
      const sex = Math.random() < 0.5 ? 'male' : 'female';
      
      list.push({ age, sex, bmi, children, smoker, region });
    }
    return list;
  };

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    try {
      const cohort = generateCohort(cohortType, portfolioSize);
      const res = await simulatePortfolioBatch(cohort);
      setSimulationResult(res);
    } catch (err) {
      setError(err.message || 'Unable to run the portfolio simulation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [cohortType, portfolioSize]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            <span>Actuarial Portfolio Stress Testing & Capital Reserve Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate aggregate claims, 95th percentile solvency capital reserves, and Value-at-Risk across synthetic policyholder cohorts.
          </p>
        </div>
        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Regenerate & Re-simulate</span>
        </button>
      </div>

      <div className="bg-slate-800/60 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Cohort Parameters & Stress Scenarios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'balanced', label: 'Balanced General Book', desc: 'Standard market distribution (~20% smokers)' },
            { id: 'young_healthy', label: 'Young Preferred Class', desc: 'Ages 20-35, standard BMI, <5% smokers' },
            { id: 'senior_cohort', label: 'Aging Senior Portfolio', desc: 'Ages 50-64, elevated baseline care requirements' },
            { id: 'adverse_stress', label: 'Adverse Selection Stress', desc: 'Severe scenario: 65% smokers & high BMI comorbidity' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCohortType(item.id)}
              className={`text-left p-3.5 rounded-xl border transition ${
                cohortType === item.id
                  ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm ring-1 ring-sky-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className={`text-xs font-bold block ${cohortType === item.id ? 'text-sky-300' : 'text-slate-200'}`}>
                {item.label}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {item.desc}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <span className="text-xs text-slate-400 font-medium">Batch Size:</span>
          {[15, 25, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => setPortfolioSize(size)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                portfolioSize === size
                  ? 'bg-slate-700 text-sky-400 border border-slate-600'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {size} Policies
            </button>
          ))}
        </div>
      </div>

      {simulationResult && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Total Expected Claim Liability</span>
              <span className="text-2xl font-bold text-white font-mono mt-1 block">
                {formatInr(simulationResult.total_expected_claims)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Avg: {formatInr(simulationResult.average_claim_per_policy)} / policy
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Aggregate Upper-Quantile Estimate</span>
              <span className="text-2xl font-bold text-amber-400 font-mono mt-1 block">
                {formatInr(simulationResult.total_reserve_p95)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Sum of per-policy P95 estimates
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Value-at-Risk (VaR 95%)</span>
              <span className="text-2xl font-bold text-sky-400 font-mono mt-1 block">
                {formatInr(simulationResult.value_at_risk_95)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Maximum Expected Tail Loss
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">High Risk Concentration</span>
              <span className={`text-2xl font-bold font-mono mt-1 block ${
                simulationResult.high_risk_policy_count > 5 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {simulationResult.high_risk_policy_count} / {simulationResult.total_policies}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {simulationResult.smoker_count} Smokers in Batch
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                Simulated Policyholder Ledger & Reserve Allocations
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {simulationResult.policies.length} Ledger Entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Policy ID</th>
                    <th className="py-2.5 px-3">Age</th>
                    <th className="py-2.5 px-3">BMI</th>
                    <th className="py-2.5 px-3">Smoker</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">Risk Tier</th>
                    <th className="py-2.5 px-3 text-right">Predicted Claim</th>
                    <th className="py-2.5 px-3 text-right">Upper P95 Reserve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {simulationResult.policies.map((p) => (
                    <tr key={p.policy_id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-sky-400">{p.policy_id}</td>
                      <td className="py-2 px-3 font-mono">{p.age}</td>
                      <td className="py-2 px-3 font-mono">{p.bmi}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.smoker === 'yes' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {p.smoker.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 capitalize">{p.region}</td>
                      <td className="py-2 px-3">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            color: p.risk_color,
                            borderColor: `${p.risk_color}50`,
                            backgroundColor: `${p.risk_color}15`
                          }}
                        >
                          {p.risk_tier}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-white">
                        {formatInr(p.predicted_claim, 2)}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-amber-400">
                        {formatInr(p.upper_bound_90ci, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
