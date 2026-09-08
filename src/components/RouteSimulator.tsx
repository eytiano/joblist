import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { SimulationResult } from '../types';

export const RouteSimulator: React.FC = () => {
  const [inputUrl, setInputUrl] = useState<string>('/');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'HEAD' | 'POST' | 'DELETE'>('GET');
  const [result, setResult] = useState<SimulationResult | null>(null);

  const simulateRequest = (url: string, method: 'GET' | 'HEAD' | 'POST' | 'DELETE') => {
    // 1. Method check
    if (method !== 'GET' && method !== 'HEAD') {
      setResult({
        rawUrl: url,
        decodedPath: url,
        normalizedPath: url,
        isTraversal: false,
        resolvedTarget: 'N/A',
        status: 405,
        statusText: 'Method Not Allowed',
        headers: {
          'Allow': 'GET, HEAD',
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        },
        message: 'RFC 7231 compliance: Static file server rejects mutative methods (POST, PUT, DELETE).'
      });
      return;
    }

    // 2. Decode URI
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(url.split('?')[0]);
    } catch {
      setResult({
        rawUrl: url,
        decodedPath: 'ERROR_MALFORMED',
        normalizedPath: 'N/A',
        isTraversal: false,
        resolvedTarget: 'N/A',
        status: 400,
        statusText: 'Bad Request',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        },
        message: 'Malformed URL encoding. The server intercepted URIError cleanly without crashing the daemon.'
      });
      return;
    }

    decodedPath = decodedPath.replace(/\0/g, '');

    // 3. Default root path
    let targetPath = decodedPath;
    if (targetPath === '/' || targetPath === '') {
      targetPath = '/careersmw.com/index.html';
    }

    // 4. Path traversal check
    // Normalize path simulation
    const isClimbingOut = targetPath.includes('..') || targetPath.startsWith('/../');
    const baseDir = '/app';
    const fakeNormalized = targetPath.replace(/\\/g, '/');
    const parts = fakeNormalized.split('/').filter(Boolean);
    const resolvedParts: string[] = [];

    let isEscaped = false;
    for (const part of parts) {
      if (part === '..') {
        if (resolvedParts.length === 0) {
          isEscaped = true;
          break;
        } else {
          resolvedParts.pop();
        }
      } else if (part !== '.') {
        resolvedParts.push(part);
      }
    }

    const resolvedTarget = baseDir + '/' + resolvedParts.join('/');

    if (isClimbingOut && (isEscaped || !resolvedTarget.startsWith(baseDir))) {
      setResult({
        rawUrl: url,
        decodedPath,
        normalizedPath: resolvedParts.join('/'),
        isTraversal: true,
        resolvedTarget,
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        },
        message: 'SECURITY ALERT: Path traversal attempt thwarted! Path escape beyond root folder was blocked.'
      });
      return;
    }

    // Known files
    if (targetPath.endsWith('careersmw.com/index.html') || targetPath === '/careersmw.com/index.html') {
      setResult({
        rawUrl: url,
        decodedPath,
        normalizedPath: 'careersmw.com/index.html',
        isTraversal: false,
        resolvedTarget: '/app/careersmw.com/index.html',
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': '4820',
          'ETag': 'W/"12d4-18f4a3e2"',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'Accept-Ranges': 'bytes'
        },
        message: 'Successfully mapped default entry point to careersmw.com/index.html via stream pipeline.'
      });
    } else if (targetPath.endsWith('package.json')) {
      setResult({
        rawUrl: url,
        decodedPath,
        normalizedPath: 'package.json',
        isTraversal: false,
        resolvedTarget: '/app/package.json',
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': '845',
          'ETag': 'W/"34d-18f4a1b0"',
          'Cache-Control': 'public, max-age=86400, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        },
        message: 'JSON file served with correct UTF-8 Content-Type and HTTP caching headers.'
      });
    } else {
      setResult({
        rawUrl: url,
        decodedPath,
        normalizedPath: resolvedParts.join('/'),
        isTraversal: false,
        resolvedTarget,
        status: 404,
        statusText: 'Not Found',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        },
        message: 'File not found on disk. Clean 404 HTML template delivered.'
      });
    }
  };

  const presetTests = [
    { label: 'Root Request (/)', url: '/', method: 'GET' as const },
    { label: 'CareersMW Landing', url: '/careersmw.com/index.html', method: 'GET' as const },
    { label: 'Traversal Attack (/../../etc/passwd)', url: '/../../etc/passwd', method: 'GET' as const },
    { label: 'Subdir Traversal (/careersmw.com/../../package.json)', url: '/careersmw.com/../../package.json', method: 'GET' as const },
    { label: 'Malformed URI (/%c0%af)', url: '/%c0%af', method: 'GET' as const },
    { label: 'Mutative POST (/upload)', url: '/upload', method: 'POST' as const },
    { label: 'Missing File (/test-404.html)', url: '/test-404.html', method: 'GET' as const }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Live Request & Security Pipeline Simulator</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Test URL paths, edge cases, and attack payloads against the server's validation logic.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {presetTests.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInputUrl(preset.url);
              setHttpMethod(preset.method);
              simulateRequest(preset.url, preset.method);
            }}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Request Form */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={httpMethod}
          onChange={(e) => setHttpMethod(e.target.value as any)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-slate-500"
        >
          <option value="GET">GET</option>
          <option value="HEAD">HEAD</option>
          <option value="POST">POST</option>
          <option value="DELETE">DELETE</option>
        </select>

        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="/path/to/resource.html"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-slate-500"
          />
          <button
            type="button"
            onClick={() => simulateRequest(inputUrl, httpMethod)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* Simulation Result */}
      {result && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Response Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  result.status === 200
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : result.status === 403
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : result.status === 400 || result.status === 405
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {result.status} {result.statusText}
              </span>
            </div>

            {result.isTraversal && (
              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                <ShieldAlert className="w-4 h-4" /> Traversal Blocked
              </span>
            )}
            {result.status === 200 && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Stream Pipeline Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Route Resolution Pipeline:</span>
              <div className="space-y-1 bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Raw:</span>
                  <span className="text-slate-800">{result.rawUrl}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Decoded:</span>
                  <span className="text-slate-800">{result.decodedPath}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Target:</span>
                  <span className="text-slate-800">{result.resolvedTarget}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Generated Response Headers:</span>
              <div className="space-y-0.5 bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px]">
                {Object.entries(result.headers).map(([key, val]) => (
                  <div key={key} className="truncate">
                    <span className="text-sky-700">{key}:</span> <span className="text-slate-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 text-slate-700 flex items-start gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <span><strong>Pipeline Analysis:</strong> {result.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
