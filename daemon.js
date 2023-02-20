/* Copyright 2022 b1f6c1c4 <b1f6c1c4@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('node:fs');
const statik = require('node-static');
const http = require('node:http');
const path = require('node:path');
const WebSocket = require('ws');
const shell = require('shelljs');
const { WebSocketServer } = WebSocket;
const pid = require('./pid');

const pdfFile = process.env.PDF_FILE;
const port = +process.env.PORT;
const msgExec = process.env.MSG_EXEC;

pid.writePID(process.env.PID_FILE);

const fileServer = new statik.Server(path.join(__dirname, 'public'), {
  indexFile: null,
});

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
  req.addListener('end', () => {
    if (req.url === '/') {
      res.writeHead(302, { Location: '/web/viewer.html' });
      res.end();
    } else if (req.url === '/pdf') {
      serveFile(pdfFile, 'application/pdf', res);
    } else {
      fileServer.serve(req, res);
    }
  }).resume();
});

const wss = new WebSocketServer({
  server,
  path: '/socket',
  perMessageDeflate: false,
});

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', (data) => {
    console.log('received: %s', data);
  });

  const msg = msgExec && shell.exec(msgExec, { silent:true }).stdout;
  ws.send(JSON.stringify({ type: 'normal', msg }));
});

const broadcast = (type) => () => {
  let msg = '';
  if (type !== 'compiling') {
    console.log(`Signal ${type} received, executing command ${msgExec}`);
    msg = msgExec && shell.exec(msgExec, { silent:true }).stdout;
  }
  console.log(`Signal ${type} received, reloading all clients for ${pdfFile}`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, msg }));
    }
  });
};

const exiting = (code) => {
  process.exit(128 + code);
};

console.log('Registering signals');
process.on('SIGUSR1', broadcast('normal'));
process.on('SIGUSR2', broadcast('warning'));
process.on('SIGSTKFLT', broadcast('error'));
process.on('SIGVTALRM', broadcast('compiling'));
process.on('SIGINT', exiting);
process.on('SIGTERM', exiting);
process.on('exit', () => {
  console.log(`Stopped listening on ${port} for ${pdfFile}`);
  pid.removePID(process.env.PID_FILE);
});

console.log(`Listening on ${port} for ${pdfFile}`);
server.listen(port);
