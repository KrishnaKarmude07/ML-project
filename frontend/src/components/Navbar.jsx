import React from 'react';
import { 
  HeartPulse,
  Activity, 
  Layers, 
  Database, 
  FileSpreadsheet, 
  BookOpen, 
  Cpu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'calculator', label: 'Claim Predictor', icon: Activity },
    { id: 'models', label: 'Model Governance', icon: Cpu },
    { id: 'segmentation', label: 'Risk Segmentation', icon: Layers },
    { id: 'explorer', label: 'Data Explorer', icon: Database },
    { id: 'portfolio', label: 'Portfolio Simulator', icon: FileSpreadsheet },
    { id: 'guidelines', label: 'Underwriting Rules', icon: BookOpen }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 ring-1 ring-sky-400/30">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">
                Insurance Claim Amount Prediction & Risk Segmentation
              </p>
            </div>
          </div>

        </div>

        <nav className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-t border-slate-800/60 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
