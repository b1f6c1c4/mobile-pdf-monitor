const fs = require('fs');

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
  startup: (fn) => {
    const pid = getCurrentPID(fn);
    if (pid) {
      if (isProcessExist(pid)) {
        console.error(`Fatal: Another program (PID ${pid}) is STILL RUNNING!`);
        process.exit(2);
      }
      removePID(fn);
    }
    writePID(fn);
  },
};
