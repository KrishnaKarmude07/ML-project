import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  TrendingUp, 
  BarChart2, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  PieChart
} from 'lucide-react';
import { fetchDatasetSummary } from '../services/api';
import { formatInr } from '../utils/currency';

export default function DataExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSmoker, setFilterSmoker] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchDatasetSummary();
        setData(res);
      } catch (err) {
        setError(err.message || 'Unable to load the actuarial dataset.');
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
        <span>Loading Actuarial Dataset Distributions...</span>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">{error}</div>;
  }

  const previewRows = data?.preview || [];
  const filteredRows = previewRows.filter((r) => {
    if (filterSmoker !== 'all' && r.smoker !== filterSmoker) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.region.toLowerCase().includes(q) ||
        r.sex.toLowerCase().includes(q) ||
        String(r.age).includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const currentRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-sky-400" />
            <span>Actuarial Dataset Explorer (2,000 Offline Records)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirically calibrated to the Medical Cost Personal Dataset featuring non-linear compounding comorbidity distributions.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            {data?.total_records?.toLocaleString()} Observations
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Portfolio Mean Claim</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">
            {formatInr(data?.avg_charge)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Median: {formatInr(data?.median_charge)}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Smoker Mean Claim</span>
          <span className="text-xl font-bold text-red-400 font-mono mt-1 block">
            {formatInr(data?.smoker_avg_charge)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">{data?.smoker_count} Smokers ({(data?.smoker_count / data?.total_records * 100).toFixed(1)}%)</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Non-Smoker Mean Claim</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
            {formatInr(data?.nonsmoker_avg_charge)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">{data?.nonsmoker_count} Non-Smokers ({(data?.nonsmoker_count / data?.total_records * 100).toFixed(1)}%)</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Smoker Payout Multiplier</span>
          <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">
            {(data?.smoker_avg_charge / data?.nonsmoker_avg_charge).toFixed(2)}x
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Severity Ratio</span>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              The "Smoking + Obesity (BMI &ge; 30)" Actuarial Tipping Point Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrates the non-linear interaction effect where claim amounts spike exponentially when obesity combines with smoking.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
            Compounding Comorbidity
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Non-Smoker Cohort
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-400">BMI &lt; 30.0 (Standard)</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatInr(data?.bmi_under_30_nonsmoker_avg)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-400">BMI &ge; 30.0 (Obese)</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatInr(data?.bmi_over_30_nonsmoker_avg)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Linear escalation (~38% increase due to elevated metabolic overhead).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/30 space-y-3">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider block">
              Smoker Cohort (High Risk)
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-400">BMI &lt; 30.0 (Smoker Normal)</span>
                <span className="font-mono font-bold text-orange-400">
                  {formatInr(data?.bmi_under_30_smoker_avg)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-red-950/40 border border-red-500/30">
                <span className="text-red-300 font-medium">BMI &ge; 30.0 (Smoker Obese Spike)</span>
                <span className="font-mono font-bold text-red-400 text-sm">
                  {formatInr(data?.bmi_over_30_smoker_avg)}
                </span>
              </div>
              <p className="text-[11px] text-red-400/90 pt-1">
                Exponential escalation (+95% over normal smoker, +480% over standard non-smoker).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Age Bracket Claim Distribution
          </h3>
          <div className="space-y-3">
            {data?.distribution_age?.map((b) => (
              <div key={b.bracket} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Cohort {b.bracket}</span>
                  <div className="flex space-x-3">
                    <span className="text-slate-400">{b.count} policies</span>
                    <span className="font-mono font-bold text-sky-400">{formatInr(b.avg_charges)}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-sky-500" 
                    style={{ width: `${Math.min(100, (b.avg_charges / 25000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Claim Amount Bins (INR, % of Total Book)
          </h3>
          <div className="space-y-3">
            {data?.distribution_charges?.map((c) => (
              <div key={c.range} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">
                    {[
                      `${formatInr(0)}-${formatInr(5000)}`,
                      `${formatInr(5000)}-${formatInr(10000)}`,
                      `${formatInr(10000)}-${formatInr(20000)}`,
                      `${formatInr(20000)}-${formatInr(35000)}`,
                      `${formatInr(35000)}+`
                    ][data.distribution_charges.indexOf(c)]}
                  </span>
                  <div className="flex space-x-3">
                    <span className="text-slate-400">{c.count} policies</span>
                    <span className="font-mono font-bold text-indigo-400">{c.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-indigo-500" 
                    style={{ width: `${c.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-700/60">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Actuarial Dataset Records Preview
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspecting sample records from the generated 2,000 offline policies.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterSmoker}
              onChange={(e) => { setFilterSmoker(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300"
            >
              <option value="all">All Smokers</option>
              <option value="yes">Smokers Only</option>
              <option value="no">Non-Smokers Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Age</th>
                <th className="py-2.5 px-3">Sex</th>
                <th className="py-2.5 px-3">BMI</th>
                <th className="py-2.5 px-3">Children</th>
                <th className="py-2.5 px-3">Smoker</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3 text-right">Charges (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono">{row.age}</td>
                  <td className="py-2.5 px-3 capitalize">{row.sex}</td>
                  <td className="py-2.5 px-3 font-mono">{row.bmi}</td>
                  <td className="py-2.5 px-3 font-mono">{row.children}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.smoker === 'yes' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {row.smoker.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 capitalize">{row.region}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-right text-white">
                    {formatInr(row.charges, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-700/60 text-xs text-slate-400">
          <span>Showing Page {currentPage} of {totalPages}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
