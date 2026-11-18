import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ClaimPredictor from './components/ClaimPredictor';
import ModelComparison from './components/ModelComparison';
import RiskSegmentation from './components/RiskSegmentation';
import DataExplorer from './components/DataExplorer';
import PortfolioSimulator from './components/PortfolioSimulator';
import ActuarialInsights from './components/ActuarialInsights';
import { fetchHealth } from './services/api';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [backendError, setBackendError] = useState('');

  useEffect(() => {
    fetchHealth()
      .then(() => setBackendError(''))
      .catch((error) => setBackendError(error.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {backendError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="font-semibold">Local model service unavailable</p>
              <p className="mt-1 text-xs text-amber-100/80">{backendError}</p>
            </div>
          </div>
        )}
        {activeTab === 'calculator' && <ClaimPredictor />}
        {activeTab === 'models' && <ModelComparison />}
        {activeTab === 'segmentation' && <RiskSegmentation />}
        {activeTab === 'explorer' && <DataExplorer />}
        {activeTab === 'portfolio' && <PortfolioSimulator />}
        {activeTab === 'guidelines' && <ActuarialInsights />}
      </main>

    </div>
  );
}
