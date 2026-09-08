import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';

const FIXED_CODE = `import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { fileURLToPath } from 'node:url';

// 1. Module configuration & environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const BASE_DIR = path.resolve(__dirname);

// 2. Comprehensive MIME dictionary with charset
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

// 3. ETag generation for HTTP 304 caching
function generateETag(stats) {
  return \`W/"\${stats.size.toString(16)}-\${stats.mtimeMs.toString(16)}"\`;
}

// 4. Safe HTTP Server with streaming pipeline & security guards
const server = http.createServer((req, res) => {
  // Method guard
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Allow': 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
    return;
  }

  // Safe URI decoding (prevents URIError daemon crash)
  let reqPath;
  try {
    reqPath = decodeURIComponent((req.url || '/').split('?')[0]).replace(/\\0/g, '');
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request: Malformed URI');
    return;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/careersmw.com/index.html';
  }

  // Path traversal prevention (CWE-22)
  const normalized = path.normalize(reqPath);
  const safeFilePath = path.resolve(BASE_DIR, '.' + path.sep + normalized);

  if (!safeFilePath.startsWith(BASE_DIR + path.sep) && safeFilePath !== BASE_DIR) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Path traversal detected');
    return;
  }

  // Replace deprecated fs.exists with asynchronous fs.stat
  fs.stat(safeFilePath, (statErr, stats) => {
    if (statErr) {
      const code = statErr.code === 'ENOENT' ? 404 : 500;
      res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(\`\${code} \${statErr.message}\`);
      return;
    }

    // Resolve directories cleanly without EISDIR crash
    if (stats.isDirectory()) {
      const indexPath = path.join(safeFilePath, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (indexErr || !indexStats.isFile()) {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('403 Directory listing forbidden');
          return;
        }
        serveFile(indexPath, indexStats, req, res);
      });
      return;
    }

    serveFile(safeFilePath, stats, req, res);
  });
});

function serveFile(filePath, stats, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const etag = generateETag(stats);
  const lastModified = stats.mtime.toUTCString();

  // 304 Not Modified conditional check
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { 'ETag': etag, 'Last-Modified': lastModified });
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'ETag': etag,
    'Last-Modified': lastModified,
    'X-Content-Type-Options': 'nosniff'
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  // O(1) Memory streaming via pipeline
  const stream = fs.createReadStream(filePath);
  req.on('close', () => { if (!stream.destroyed) stream.destroy(); });
  pipeline(stream, res, () => {});
}

server.listen(PORT, HOST, () => {
  console.log(\`Server running at http://\${HOST}:\${PORT}/\`);
});`;

export const ServerCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FIXED_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-slate-700" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">server.js (ESM / Node.js 18+)</h2>
            <p className="text-xs text-slate-500">Fully patched, high-performance static server implementation</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>

      <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[500px]">
        <pre>{FIXED_CODE}</pre>
      </div>
    </div>
  );
};
