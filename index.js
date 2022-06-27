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
const path = require('node:path');
const { spawn } = require('node:child_process');
const pid = require('./pid');

const pidFile = '.mobile-pdf-monitor.pid';

const sendSignal = (signal) => {
  const p = pid.getCurrentPID(pidFile);
  if (p === null) {
    console.error('Fatal: There is no PID file, please double check CWD:', process.cwd());
    process.exit(2);
  }
  try {
    process.kill(p, signal);
    console.log(`Info: Signal ${signal} sent to program (PID ${p})`);
  } catch (err) {
    if (err.code == 'ESRCH') {
      console.error(`Notice: Obselete PID file detected, cleanning up`);
      pid.removePID(pidFile);
    } else {
      console.error(`Fatal: Failed to send ${signal} to program (PID ${p})`, err);
      process.exit(2);
    }
  }
};

const launchDaemon = (pdfFile, port) => {
  if (!fs.existsSync(pdfFile)) {
    console.error(`Warning: File ${pdfFile} does not exist`);
  }
  pid.cleanup(pidFile);

  process.env.PDF_FILE = pdfFile;
  process.env.PID_FILE = pidFile;
  process.env.PORT = '' + port;
  spawn(process.argv[0], [path.join(__dirname, 'daemon.js')], {
    detected: true,
    stdio: ['ignore', 'inherit', 'inherit']
  }).unref();
  console.log(`Launched web server on ${port} for ${pdfFile}`);
};

module.exports = () => {
  switch (process.argv.length) {
    case 4:
      const pdfFile = process.argv[2];
      const port = +process.argv[3];
      launchDaemon(pdfFile, port);
      break;
    case 3:
      if (process.argv[2] === 'stop') {
        sendSignal('SIGTERM');
      } else if (process.argv[2] === 'reload') {
        sendSignal('SIGUSR1');
      } else {
        const pdfFile = process.argv[2];
        const port = +process.env.PORT || 8080;
        launchDaemon(pdfFile, port);
      }
      break;
    default:
      console.log(`Usage: To start a web server, run:
    mobile-pdf-monitor <path-to-pdf> [<port:8080>]
  Note that the web server forks and runs in background.
To trigger reload, run:
    mobile-pdf-monitor reload
To quit daemon, run:
    mobile-pdf-monitor stop

Note that <cwd> is very important for ALL those commands.`);
      process.exit(1);
  }
  setTimeout(() => {}, 50);
};
