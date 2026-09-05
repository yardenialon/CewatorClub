/* Persistence for the club state and auth records.
 *
 * The JSON-file implementation below is the default. It writes atomically
 * (temp file + rename) and keeps the whole state in memory, which is plenty
 * for a pilot. To move to Postgres or another database, implement the same
 * four methods (loadState, saveState, loadAuth, saveAuth) in a new file and
 * select it from server/index.js. Nothing else in the server touches disk.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

class JsonStore {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.stateFile = path.join(dir, 'state.json');
    this.authFile = path.join(dir, 'auth.json');
  }

  _read(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) {
      if (err.code === 'ENOENT') return fallback;
      throw err;
    }
  }

  _write(file, value) {
    const tmp = file + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, file);
  }

  loadState() { return this._read(this.stateFile, null); }
  saveState(state) { this._write(this.stateFile, state); }
  loadAuth() { return this._read(this.authFile, { tokens: {} }); }
  saveAuth(auth) { this._write(this.authFile, auth); }
}

module.exports = { JsonStore };
