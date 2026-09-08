import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { fileURLToPath } from 'node:url';

// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port & Host configuration
// Respects process.env.PORT for Cloud Run/container environments, falls back to 8080
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const BASE_DIR = path.resolve(__dirname);

// Comprehensive MIME types dictionary
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
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8'
};

/**
 * Generates an HTTP entity tag (ETag) from file statistics
 */
function generateETag(stats) {
  const mtime = stats.mtimeMs.toString(16);
  const size = stats.size.toString(16);
  return `W/"${size}-${mtime}"`;
}

/**
 * Standard error response helper
 */
function sendError(res, statusCode, title, message) {
  if (res.headersSent) return;
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${statusCode} - ${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 500px; width: 100%; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
    h1 { margin: 0 0 8px 0; font-size: 24px; color: #ef4444; font-weight: 600; }
    p { margin: 0 0 20px 0; color: #94a3b8; line-height: 1.5; font-size: 15px; }
    code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #38bdf8; font-family: monospace; word-break: break-all; }
    a { color: #38bdf8; text-decoration: none; font-size: 14px; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${statusCode} ${title}</h1>
    <p>${message}</p>
    <a href="/">← Return to Home</a>
  </div>
</body>
</html>`);
}

/**
 * Create high-performance HTTP server
 */
const server = http.createServer((req, res) => {
  // 1. Method validation: only GET and HEAD are permitted for static file serving
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Allow': 'GET, HEAD',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end('405 Method Not Allowed: Only GET and HEAD requests are supported');
    return;
  }

  // 2. Safely decode URI to prevent unhandled URIError crashes
  let reqPath;
  try {
    const rawUrl = req.url || '/';
    reqPath = decodeURIComponent(rawUrl.split('?')[0]);
  } catch (err) {
    sendError(res, 400, 'Bad Request', 'Malformed URL encoding. Please verify your request path.');
    return;
  }

  // 3. Strip null bytes to prevent poison-null-byte bypasses
  reqPath = reqPath.replace(/\0/g, '');

  // 4. Default root mapping to careersmw.com/index.html with fallback checks
  let isRoot = false;
  if (reqPath === '/' || reqPath === '') {
    isRoot = true;
    reqPath = '/careersmw.com/index.html';
  }

  // 5. Secure path resolution preventing Directory Traversal (CWE-22)
  // Normalize path and resolve safely relative to BASE_DIR
  const normalizedReqPath = path.normalize(reqPath);
  let safeFilePath = path.resolve(BASE_DIR, '.' + path.sep + normalizedReqPath);

  // Security check: ensure path remains inside BASE_DIR
  if (!safeFilePath.startsWith(BASE_DIR + path.sep) && safeFilePath !== BASE_DIR) {
    sendError(res, 403, 'Forbidden', 'Directory traversal detected. Access to paths outside the root directory is forbidden.');
    return;
  }

  // 6. Asynchronous stats check replacing deprecated fs.exists (eliminates TOCTOU race condition)
  fs.stat(safeFilePath, (statErr, stats) => {
    // If root requested /careersmw.com/index.html but not found, try fallback to ./index.html or ./dist/index.html
    if (statErr && isRoot) {
      const fallbackCandidates = [
        path.join(BASE_DIR, 'dist', 'index.html'),
        path.join(BASE_DIR, 'index.html'),
        path.join(BASE_DIR, 'public', 'index.html')
      ];

      const tryFallback = (index) => {
        if (index >= fallbackCandidates.length) {
          sendError(res, 404, 'Not Found', `Target file not found: <code>${reqPath}</code>. Place your website files in <code>careersmw.com/</code> or the root directory.`);
          return;
        }
        const fallbackPath = fallbackCandidates[index];
        fs.stat(fallbackPath, (fallbackErr, fallbackStats) => {
          if (!fallbackErr && fallbackStats.isFile()) {
            serveFile(fallbackPath, fallbackStats, req, res);
          } else {
            tryFallback(index + 1);
          }
        });
      };

      tryFallback(0);
      return;
    }

    if (statErr) {
      if (statErr.code === 'ENOENT') {
        sendError(res, 404, 'Not Found', `The requested file <code>${reqPath}</code> was not found on this server.`);
      } else if (statErr.code === 'EACCES') {
        sendError(res, 403, 'Forbidden', `Access denied to requested file <code>${reqPath}</code>.`);
      } else {
        sendError(res, 500, 'Server Error', `An error occurred while accessing the file: ${statErr.message}`);
      }
      return;
    }

    // 7. Directory handling: resolve index.html instead of crashing with EISDIR
    if (stats.isDirectory()) {
      // Ensure trailing slash for canonical directory URLs
      const originalPath = req.url.split('?')[0];
      if (!originalPath.endsWith('/')) {
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        res.writeHead(301, {
          'Location': originalPath + '/' + query,
          'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end('301 Redirecting to directory with trailing slash');
        return;
      }

      const indexPath = path.join(safeFilePath, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (indexErr || !indexStats.isFile()) {
          sendError(res, 403, 'Forbidden', `Directory listing is disabled for <code>${reqPath}</code>.`);
          return;
        }
        serveFile(indexPath, indexStats, req, res);
      });
      return;
    }

    // Serve standard file
    serveFile(safeFilePath, stats, req, res);
  });
});

/**
 * Serves static file with streaming, ETag, Last-Modified caching, and error safety
 */
function serveFile(filePath, stats, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const etag = generateETag(stats);
  const lastModified = stats.mtime.toUTCString();

  // 8. HTTP Caching validation (304 Not Modified)
  const clientEtag = req.headers['if-none-match'];
  const clientModifiedSince = req.headers['if-modified-since'];

  if (clientEtag && clientEtag === etag) {
    res.writeHead(304, {
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end();
    return;
  }

  if (clientModifiedSince) {
    const clientDate = new Date(clientModifiedSince);
    if (!isNaN(clientDate.getTime()) && stats.mtime <= clientDate) {
      res.writeHead(304, {
        'ETag': etag,
        'Last-Modified': lastModified,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end();
      return;
    }
  }

  // Response headers
  const headers = {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'ETag': etag,
    'Last-Modified': lastModified,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes'
  };

  // If HEAD request, return headers only
  if (req.method === 'HEAD') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  // 9. High-performance Stream Pipelining replacing fs.readFile memory buffering
  res.writeHead(200, headers);
  const stream = fs.createReadStream(filePath);

  // Clean stream cleanup on client disconnect
  req.on('close', () => {
    if (!stream.destroyed) {
      stream.destroy();
    }
  });

  pipeline(stream, res, (pipelineErr) => {
    if (pipelineErr && pipelineErr.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      console.error(`Streaming error serving ${filePath}:`, pipelineErr.message);
    }
  });
}

// 10. Server error handling (prevents uncaught EADDRINUSE crash)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the running process or specify a different port via PORT=...`);
  } else {
    console.error('Server encountered an error:', err);
  }
  process.exit(1);
});

// Start listening
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
  console.log(`CareersMW URL: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/careersmw.com/index.html`);
});

export default server;
