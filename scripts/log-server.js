const http = require('http');
const fs = require('fs');

const LOG_FILE = '/tmp/albatross-debug.log';
const PORT = 3099; // 3000番台を避けて干渉しないポート

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { level, args, timestamp } = JSON.parse(body);
        const line = `[${timestamp}] [${level.toUpperCase()}] ${args.join(' ')}\n`;
        fs.appendFileSync(LOG_FILE, line);
        res.writeHead(200);
        res.end();
      } catch (e) {
        res.writeHead(400);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  fs.writeFileSync(LOG_FILE, `=== Log started ${new Date().toISOString()} ===\n`);
  process.stdout.write(`[log-server] port:${PORT} -> ${LOG_FILE}\n`);
});
