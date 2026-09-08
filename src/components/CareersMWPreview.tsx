import React from 'react';
import { ExternalLink } from 'lucide-react';

export const CareersMWPreview: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          </div>
          <span className="text-xs font-mono text-slate-600 ml-2">
            http://localhost:8080/careersmw.com/index.html
          </span>
        </div>
        <a
          href="/careersmw.com/index.html"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <span>Open Standalone</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="h-[550px] w-full bg-slate-900">
        <iframe
          src="/careersmw.com/index.html"
          title="CareersMW Preview"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};
