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
const { spawn, fork } = require('node:child_process');
const { quote } = require('shell-quote');
const pid = require('./pid');

const pidFile = '.pdfmon.pid';

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

const launchDaemon = (pdfFile) => {
  if (!fs.existsSync(pdfFile)) {
    console.error(`Warning: File ${pdfFile} does not exist`);
  }
  pid.cleanup(pidFile);

  process.env.PDF_FILE = pdfFile;
  process.env.PID_FILE = pidFile;
  const port = +process.env.PORT || 8080;
  process.env.PORT = '' + port;
  fork(path.join(__dirname, 'daemon.js'), [], {
    detached: true,
  }).unref();
  console.log(`Launched web server on ${port} for ${pdfFile}`);
};

const showUsage = () => {
  console.log(`Usage: To start a web server, run:
    pdfmon start <path-to-pdf>
  Note that the web server forks and runs in background.
To trigger reload, run:
    pdfmon reload
To quit daemon, run:
    pdfmon stop
To automatically run latexmk, run:
    pdfmon latexmk [<options>] <main.tex>

Note that <cwd> is very important for ALL those commands.
Adjust listing port by environment variable PORT.`);
  process.exit(1);
};

const launchLaTeXmk = (args) => {
  pid.cleanup(pidFile);
  const me = quote([process.argv[0], process.argv[1]]);
  const sub = spawn('latexmk', [
    '-pvc',
    '-e',
    `$pdf_previewer="${me} start %S"`,
    '-e',
    '$pdf_update_method=4',
    '-e',
    `$pdf_update_command="${me} reload"`,
    '-pdf',
    ...args,
  ], {
    stdio: 'inherit',
    detached: false,
  });
  const handler = (signal) => {
    sub.kill(signal);
  };
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
  process.on('SIGQUIT', handler);
  process.on('SIGABRT', handler);
  sub.on('exit', () => {
    sendSignal('SIGTERM');
  });
};

module.exports = () => {
  if (process.argv.length < 3) {
    showUsage();
  }

  const [, , verb, ...rest] = process.argv;
  switch (verb) {
    case 'start':
      const [pdfFile, port] = rest;
      launchDaemon(pdfFile);
      break;
    case 'stop':
      sendSignal('SIGTERM');
      break;
    case 'reload':
      sendSignal('SIGUSR1');
      break;
    case 'latexmk':
      launchLaTeXmk(rest);
      break;
    default:
      showUsage();
  }
  setTimeout(() => {}, 50);
};
