/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StatusHeader } from './components/StatusHeader';
import { ErrorAuditList } from './components/ErrorAuditList';
import { RouteSimulator } from './components/RouteSimulator';
import { ServerCodeViewer } from './components/ServerCodeViewer';
import { CareersMWPreview } from './components/CareersMWPreview';

export default function App() {
  const [activeTab, setActiveTab] = useState<'audit' | 'simulator' | 'code' | 'careersmw'>('audit');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <StatusHeader currentTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'audit' && <ErrorAuditList />}
        {activeTab === 'simulator' && <RouteSimulator />}
        {activeTab === 'code' && <ServerCodeViewer />}
        {activeTab === 'careersmw' && <CareersMWPreview />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Static File Server &bull; Node.js stream pipeline with ETag caching, directory index resolution, and CWE-22 path traversal defense.
      </footer>
    </div>
  );
}
