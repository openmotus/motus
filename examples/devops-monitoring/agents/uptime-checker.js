/**
 * Uptime Checker — pings configured endpoints and reports health status.
 *
 * Environment variables:
 *   MONITORED_URLS  Comma-separated list of URLs to check
 *
 * Output: JSON object with per-service status and summary
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const URLS = (process.env.MONITORED_URLS || 'https://example.com')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const TIMEOUT_MS = 10000;
const DEGRADED_THRESHOLD_MS = 2000;

async function checkEndpoint(urlStr) {
  const url = new URL(urlStr);
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve) => {
    const start = Date.now();

    const req = client.get(urlStr, { timeout: TIMEOUT_MS }, (res) => {
      const responseMs = Date.now() - start;
      const result = {
        url: urlStr,
        httpCode: res.statusCode,
        responseMs,
        sslDaysRemaining: null,
        status: 'healthy'
      };

      // Check SSL certificate if HTTPS
      if (url.protocol === 'https:' && res.socket) {
        const cert = res.socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          const expiry = new Date(cert.valid_to);
          result.sslDaysRemaining = Math.floor((expiry - Date.now()) / 86400000);

          if (result.sslDaysRemaining < 14) {
            result.status = 'degraded';
            result.sslWarning = `SSL expires in ${result.sslDaysRemaining} days`;
          }
        }
      }

      // Classify status
      if (res.statusCode >= 500) {
        result.status = 'down';
      } else if (res.statusCode >= 400) {
        result.status = 'degraded';
      } else if (responseMs > DEGRADED_THRESHOLD_MS) {
        result.status = 'degraded';
        result.latencyWarning = `Response time ${responseMs}ms exceeds ${DEGRADED_THRESHOLD_MS}ms threshold`;
      }

      res.resume(); // drain response
      resolve(result);
    });

    req.on('error', (err) => {
      resolve({
        url: urlStr,
        httpCode: null,
        responseMs: Date.now() - start,
        status: 'down',
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url: urlStr,
        httpCode: null,
        responseMs: TIMEOUT_MS,
        status: 'down',
        error: 'Request timed out'
      });
    });
  });
}

async function main() {
  const services = await Promise.all(URLS.map(checkEndpoint));

  const summary = {
    total: services.length,
    healthy: services.filter(s => s.status === 'healthy').length,
    degraded: services.filter(s => s.status === 'degraded').length,
    down: services.filter(s => s.status === 'down').length
  };

  const report = {
    timestamp: new Date().toISOString(),
    services,
    summary
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error('Uptime checker failed:', err.message);
  process.exit(1);
});
