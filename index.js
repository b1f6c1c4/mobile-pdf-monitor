const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;
const pid = require('./pid');

const port = 8080;

let pdfFile;
const pidFile = '.mobile-pdf-monitor.pid';

switch (process.argv.length) {
  case 3:
    pdfFile = process.argv[2];
    break;
  case 2:
    const p = pid.getCurrentPID(pidFile);
    if (p === null) {
      console.error('Fatal: There is no PID file, please double check CWD:', process.cwd());
      process.exit(2);
    }
    try {
      process.kill(p, 'SIGUSR1');
    } catch (err) {
      console.error(`Fatal: Failed to send SIGUSR1 to program (PID ${p})`, err);
      process.exit(2);
    }
    process.exit(0);
    break;
  default:
    console.log(`Usage: To start a web server, run:
    mobile-pdf-monitor <path-to-pdf>
To trigger reload, run:
    mobile-pdf-monitor

Note that <cwd> is very important for both commands.`);
    process.exit(1);
}

pid.startup(pidFile);

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
      serveFile(pdfFile, 'application/pdf', res);
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

const broadcast = () => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send();
    }
  });
};

process.on('SIGUSR1', broadcast);

console.log(`Listening on ${port} for ${pdfFile}`);
server.listen(port);
