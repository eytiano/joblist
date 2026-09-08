import React, { useState } from 'react';
import { Server, CheckCircle2, Copy, Check, Terminal } from 'lucide-react';

interface StatusHeaderProps {
  onSelectTab: (tab: 'audit' | 'simulator' | 'code' | 'careersmw') => void;
  currentTab: 'audit' | 'simulator' | 'code' | 'careersmw';
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({ onSelectTab, currentTab }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('node server.js');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Static File Server</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Fixed & Stabilized
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Production-grade Node.js server with path traversal prevention, stream pipelining, and HTTP caching
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCommand}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span>node server.js</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectTab('audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'audit'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Fixed Errors & Optimizations
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('simulator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'simulator'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Route & Security Simulator
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('code')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'code'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Server Source (server.js)
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('careersmw')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'careersmw'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Preview careersmw.com
          </button>
        </div>
      </div>
    </header>
  );
};
