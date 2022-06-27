const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;

const serveFile = (fn, mime, res) => {
  fs.readFile(fn, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
    });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  switch (req.url) {
    case '/':
      serveFile(path.join(__dirname, 'index.html'), 'text/html', res);
      break;
    case '/pdf':
      serveFile(path.join(__dirname, 'main.pdf'), 'application/pdf', res);
      break;
    default:
      res.writeHead(404);
      res.end();
      return;
  }
});

const wss = new WebSocketServer({
  server,
  path: '/socket',
  perMessageDeflate: false,
});

const broadcast = (msg) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

server.listen(8080);
