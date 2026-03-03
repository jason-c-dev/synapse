const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const level = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

function log(lvl, tag, ...args) {
  if (LEVELS[lvl] > level) return;
  const prefix = `${timestamp()} [${lvl.toUpperCase()}] [${tag}]`;
  const fn = lvl === 'error' ? console.error : lvl === 'warn' ? console.warn : console.log;
  fn(prefix, ...args);
}

export function logger(tag) {
  return {
    error: (...args) => log('error', tag, ...args),
    warn: (...args) => log('warn', tag, ...args),
    info: (...args) => log('info', tag, ...args),
    debug: (...args) => log('debug', tag, ...args),
  };
}
