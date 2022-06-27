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

const getCurrentPID = (fn) => {
  if (!fs.existsSync(fn))
    return null;

  try {
    return +fs.readFileSync(fn, 'utf-8');
  } catch (err) {
    console.error(`Fatal: PID file ${fn} exists but is NOT readable`, err);
    process.exit(2);
  }
};

const isProcessExist = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return false;
  }
};

const removePID = (fn) => {
  try {
    fs.rmSync(fn);
  } catch (err) {
    console.error(`Fatal: Old PID file ${fn} exists and cannot be removed`, err);
    process.exit(2);
  }
};

const writePID = (fn) => {
  try {
    fs.writeFileSync(fn, ''+process.pid, {
      encoding: 'utf-8',
      flag: 'wx',
    });
  } catch (err) {
    console.error(`Fatal: Cannot create PID file ${fn}`, err);
    process.exit(2);
  }
};

module.exports = {
  getCurrentPID,
  removePID,
  writePID,
  cleanup: (fn) => {
    const pid = getCurrentPID(fn);
    if (pid) {
      if (isProcessExist(pid)) {
        console.error(`Fatal: Another program (PID ${pid}) is STILL RUNNING!`);
        process.exit(2);
      }
      console.error(`Notice: Obselete PID file detected, cleanning up`);
      removePID(fn);
    }
  },
};
