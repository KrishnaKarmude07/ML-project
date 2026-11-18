import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { predictClaim } from '../services/api';
import { formatInr } from '../utils/currency';

export default function ClaimPredictor() {
  const [formData, setFormData] = useState({
    age: 38,
    sex: 'male',
    bmi: 28.4,
    children: 1,
    smoker: 'no',
    region: 'northwest'
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const presets = [
    {
      label: 'Standard Young Adult',
      data: { age: 24, sex: 'female', bmi: 22.1, children: 0, smoker: 'no', region: 'northwest' }
    },
    {
      label: 'Mid-Age Overweight Non-Smoker',
      data: { age: 44, sex: 'male', bmi: 28.5, children: 2, smoker: 'no', region: 'northeast' }
    },
    {
      label: 'Senior With Dependents',
      data: { age: 60, sex: 'female', bmi: 29.8, children: 1, smoker: 'no', region: 'southwest' }
    },
    {
      label: 'Critical Comorbidity Spike',
      data: { age: 46, sex: 'male', bmi: 34.2, children: 2, smoker: 'yes', region: 'southeast' }
    }
  ];

  const handlePredict = async (dataToPredict = formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictClaim(dataToPredict);
      setPrediction(res);
    } catch (err) {
      setError(err.message || 'Error executing actuarial prediction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePredict(formData);
  }, []);

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
  };

  const applyPreset = (presetData) => {
    setFormData(presetData);
    handlePredict(presetData);
  };

  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (bmi < 25.0) return { label: 'Normal Weight', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (bmi < 30.0) return { label: 'Overweight', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (bmi < 35.0) return { label: 'Obese (Class I)', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { label: 'Severe / Morbid Obese', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

  const isTippingPoint = formData.smoker === 'yes' && formData.bmi >= 30.0;
  const bmiCategory = getBmiCategory(formData.bmi);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-sky-400" />
            <span>Interactive Actuarial Claim Underwriting Calculator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inference using Gradient Boosting (loss=squared_error) with Quantile Regression 90% confidence bounds and K-Means segmentation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p.data)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isTippingPoint && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-start space-x-3.5 text-red-200 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-red-300 uppercase tracking-wide">
              Critical Actuarial Non-Linear Interaction Detected
            </p>
            <p className="text-slate-300">
              Active smoking coupled with BMI &ge; 30.0 breaches the clinical comorbidity threshold.               The synthetic training data models an exponential BMI-related claim increase for this profile. The production estimate is learned from the trained Gradient Boosting model and should be reviewed alongside its quantile range.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 self-start bg-slate-800/60 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Policyholder Risk Attributes
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              Input Vectors
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Age</label>
                <span className="text-sky-400 font-mono font-bold text-sm">{formData.age} years</span>
              </div>
              <input
                type="range"
                min="18"
                max="64"
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>18 (Entry)</span>
                <span>40 (Mid-Career)</span>
                <span>64 (Senior)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="flex items-center space-x-2">
                  <label className="text-slate-300 font-medium">Body Mass Index (BMI)</label>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${bmiCategory.color}`}>
                    {bmiCategory.label}
                  </span>
                </div>
                <span className="text-sky-400 font-mono font-bold text-sm">{formData.bmi.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="16.0"
                max="53.0"
                step="0.1"
                value={formData.bmi}
                onChange={(e) => handleChange('bmi', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>16.0</span>
                <span className="text-amber-400 font-medium">30.0 (Tipping Point)</span>
                <span>53.0</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender / Sex</label>
                <div className="grid grid-cols-2 gap-2">
                  {['male', 'female'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleChange('sex', val)}
                      className={`text-xs py-2 rounded-xl capitalize font-medium border transition ${
                        formData.sex === val
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-semibold shadow-sm shadow-sky-500/20'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Smoker Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['no', 'yes'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleChange('smoker', val)}
                      className={`text-xs py-2 rounded-xl capitalize font-medium border transition ${
                        formData.smoker === val
                          ? val === 'yes'
                            ? 'bg-red-500/20 border-red-500 text-red-300 font-semibold shadow-sm shadow-red-500/20'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val === 'yes' ? 'Smoker (Yes)' : 'Non-Smoker'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">Children / Dependents</label>
                  <span className="text-sky-400 font-mono font-bold text-sm">{formData.children}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={formData.children}
                  onChange={(e) => handleChange('children', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Geographic Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 capitalize"
                >
                  <option value="northeast">Northeast Region</option>
                  <option value="northwest">Northwest Region</option>
                  <option value="southeast">Southeast Region</option>
                  <option value="southwest">Southwest Region</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handlePredict(formData)}
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Recalculating Actuarial Models...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Execute Actuarial Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/50 text-red-200 text-xs">
              {error}
            </div>
          )}

          {prediction && (
            <>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-20"
                  style={{ backgroundColor: prediction.risk_color }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-700/60">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Production Payout Estimate (GBM Regressor)
                    </span>
                    <div className="flex items-baseline space-x-3 mt-1">
                      <span className="text-4xl font-extrabold text-white tracking-tight">
                        {formatInr(prediction.point_prediction, 2)}
                      </span>
                      <span className="text-xs text-slate-400">INR / annum</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ 
                        color: prediction.risk_color,
                        borderColor: `${prediction.risk_color}50`,
                        backgroundColor: `${prediction.risk_color}15`
                      }}
                    >
                      {prediction.risk_tier}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Unsupervised Risk Cluster #{prediction.risk_cluster}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center space-x-1">
                      <span>90% Double-Quantile Confidence Interval</span>
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                    <span className="text-slate-300 font-mono">
                      [ {formatInr(prediction.lower_bound_90ci)} — {formatInr(prediction.upper_bound_90ci)} ]
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        marginLeft: '5%',
                        width: '90%',
                        background: `linear-gradient(90deg, #38bdf8 0%, ${prediction.risk_color} 100%)`
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>5th Percentile Lower: {formatInr(prediction.lower_bound_90ci)}</span>
                    <span className="font-medium text-slate-300">Spread: {formatInr(prediction.confidence_interval_width)}</span>
                    <span>95th Percentile Upper: {formatInr(prediction.upper_bound_90ci)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Statutory Reserve</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      +{formatInr(prediction.recommended_safety_reserve)}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Actuarial Base Rate</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {formatInr(prediction.actuarial_base_rate)}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">BMI Risk Multiplier</span>
                    <span className="text-sm font-bold text-sky-400 font-mono">
                      {prediction.bmi_risk_multiplier}x
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Smoker Surcharge</span>
                    <span className={`text-sm font-bold font-mono ${prediction.smoker_surcharge_applied ? 'text-red-400' : 'text-emerald-400'}`}>
                      {prediction.smoker_surcharge_applied ? 'APPLIED' : 'NONE'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <span>Cross-Algorithm Claim Predictions</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">3 Supervised Regressors</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-sky-500/30">
                    <div className="flex justify-between items-center text-[11px] text-sky-400 mb-1">
                      <span className="font-semibold">Gradient Boosting</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 font-mono">Primary</span>
                    </div>
                    <span className="text-lg font-bold text-white font-mono">
                      {formatInr(prediction.gb_prediction, 2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Non-linear interaction aware</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
                    <div className="flex justify-between items-center text-[11px] text-slate-300 mb-1">
                      <span className="font-semibold">Random Forest</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Ensemble</span>
                    </div>
                    <span className="text-lg font-bold text-slate-200 font-mono">
                      {formatInr(prediction.rf_prediction, 2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Variance-reduced bagging</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
                    <div className="flex justify-between items-center text-[11px] text-slate-300 mb-1">
                      <span className="font-semibold">Ridge Regression</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">L2 Linear</span>
                    </div>
                    <span className="text-lg font-bold text-slate-200 font-mono">
                      {formatInr(prediction.ridge_prediction, 2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Regularized linear baseline</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Actuarial Feature Impact Attribution</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Sensitivity Decomposition</span>
                </div>

                <div className="space-y-3 pt-1">
                  {prediction.feature_impacts.map((impact, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{impact.feature}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {impact.impact_value > 0 ? `+${formatInr(impact.impact_value)}` : formatInr(impact.impact_value)}
                          </span>
                          <span className="text-sky-400 font-mono font-bold text-xs w-12 text-right">
                            {impact.percentage_contribution}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                          style={{ width: `${Math.min(100, Math.max(3, impact.percentage_contribution))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
