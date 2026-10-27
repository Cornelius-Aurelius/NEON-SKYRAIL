/* NEON SKYRAIL — deterministic, testable arcade rules.
   Created by Cornelius Aurelius. MIT-licensed game source. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkyrailCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LANES = 3;
  const MODES = ['endless', 'rush', 'training'];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function rng(state) {
    let x = state.seed | 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    state.seed = x | 0;
    return (x >>> 0) / 4294967296;
  }
  function newGame(mode = 'endless', seed = 20261027) {
    if (!MODES.includes(mode)) throw new Error('Unknown game mode');
    return {
      mode, seed: (seed | 0) || 101, status: 'running', elapsed: 0, distance: 0,
      lane: 1, speed: 110, lives: mode === 'training' ? 999 : 3,
      score: 0, combo: 0, bestCombo: 0, avoided: 0, hits: 0, pickups: 0,
      energy: 0, boostLeft: 0, boostUsed: 0, spawnClock: 0, nextId: 1,
      rows: [], events: [], lastSpawnDistance: 0
    };
  }
  function setLane(s, lane) {
    if (s.status !== 'running') return false;
    const n = clamp(Math.round(lane), 0, LANES - 1);
    if (n === s.lane) return false;
    s.lane = n;
    s.events.push({ type: 'steer', lane: n });
    return true;
  }
  function shiftLane(s, direction) { return setLane(s, s.lane + Math.sign(direction)); }
  function useBoost(s) {
    if (s.status !== 'running' || s.energy < 100 || s.boostLeft > 0) return false;
    s.energy = 0; s.boostLeft = 3.2; s.boostUsed++;
    s.events.push({ type: 'boost' });
    return true;
  }
  function makeRow(s) {
    const intensity = clamp(s.distance / 700, 0, 1);
    const double = s.distance > 170 && rng(s) < 0.18 + intensity * 0.52;
    const safe = Math.floor(rng(s) * LANES);
    let blocked;
    if (double) blocked = [0, 1, 2].filter(i => i !== safe);
    else blocked = [Math.floor(rng(s) * LANES)];
    const clear = [0, 1, 2].filter(i => !blocked.includes(i));
    const prizeLane = clear[Math.floor(rng(s) * clear.length)];
    return {
      id: s.nextId++, p: -0.07, blocked, prizeLane,
      prize: rng(s) < 0.75, type: rng(s) < 0.5 ? 'barrier' : 'pulse',
      processed: false
    };
  }
  function advance(s, dt) {
    s.events = [];
    if (s.status !== 'running') return s.events;
    if (!Number.isFinite(dt) || dt < 0) throw new Error('Invalid timestep');
    if (dt === 0) return s.events;
    // Browser tab throttling must not instantly skip over incoming obstacles.
    dt = Math.min(dt, 0.05);
    s.elapsed += dt;
    s.boostLeft = Math.max(0, s.boostLeft - dt);
    s.speed = Math.min(285, 110 + s.distance * 0.022);
    const boosted = s.boostLeft > 0;
    s.distance += s.speed * dt * (boosted ? 1.32 : 1);
    s.spawnClock += dt;
    const interval = Math.max(0.88, 1.65 - s.distance / 2500);
    if (s.spawnClock >= interval) {
      s.spawnClock -= interval;
      s.rows.push(makeRow(s));
      s.lastSpawnDistance = s.distance;
      s.events.push({ type: 'spawn' });
    }
    const flight = Math.max(2.12, 2.86 - s.distance / 4700);
    for (const row of s.rows) {
      row.p += dt / flight;
      if (row.processed || row.p < 1) continue;
      row.processed = true;
      if (row.blocked.includes(s.lane)) {
        s.hits++; s.combo = 0;
        if (s.mode !== 'training') s.lives--;
        s.events.push({ type: 'hit', lives: s.lives });
        if (s.lives <= 0) {
          s.status = 'over';
          s.events.push({ type: 'over', reason: 'crash' });
          break;
        }
      } else {
        s.avoided++; s.combo++;
        s.bestCombo = Math.max(s.bestCombo, s.combo);
        const base = 18 + Math.min(22, s.combo * 2);
        const gained = Math.floor(base * (boosted ? 2 : 1));
        s.score += gained;
        s.events.push({ type: 'dodge', score: gained, combo: s.combo });
        if (row.prize && row.prizeLane === s.lane) {
          s.pickups++;
          s.energy = clamp(s.energy + 22, 0, 100);
          s.score += boosted ? 100 : 50;
          s.events.push({ type: 'prize' });
        }
      }
    }
    s.rows = s.rows.filter(r => r.p < 1.16);
    if (s.mode === 'rush' && s.elapsed >= 90 && s.status === 'running') {
      s.status = 'over';
      s.events.push({ type: 'over', reason: 'time' });
    }
    return s.events;
  }
  function pause(s) {
    if (s.status === 'running') { s.status = 'paused'; return true; }
    if (s.status === 'paused') { s.status = 'running'; return true; }
    return false;
  }
  return { LANES, MODES, clamp, newGame, setLane, shiftLane, useBoost, makeRow, advance, pause };
});