// CodeSync AI - Collaboration Server (Hocuspocus + Yjs)
const http = require('http');

const PORT = process.env.PORT || 1234;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'collaboration-server', port: PORT }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('CodeSync AI Collaboration WebSocket Gateway');
  }
});

server.listen(PORT, () => {
  console.log(`[CodeSync AI] Collaboration server running on port ${PORT}`);
});
