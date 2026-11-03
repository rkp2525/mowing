'use strict';
// Smoke test for js/audio.js using a minimal mock Web Audio implementation.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

function param(v) {
  return {
    value: v || 0,
    setValueAtTime() { return this; }, linearRampToValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; }, setTargetAtTime() { return this; },
    cancelScheduledValues() { return this; },
  };
}
let nodeCount = 0;
function node(extra) {
  const n = Object.assign({
    connect(d) { return d; }, disconnect() {}, start() {}, stop() {},
  }, extra);
  nodeCount++;
  return n;
}
let mockTime = 0;
class MockAudioContext {
  constructor() { this.sampleRate = 8000; this.state = 'suspended'; this.destination = node(); }
  get currentTime() { return mockTime; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { return node({ gain: param(1) }); }
  createOscillator() { return node({ type: 'sine', frequency: param(440), detune: param(0) }); }
  createBiquadFilter() { return node({ type: 'lowpass', frequency: param(350), Q: param(1), gain: param(0) }); }
  createBufferSource() { return node({ buffer: null, loop: false, playbackRate: param(1) }); }
  createBuffer(ch, len) {
    const data = []; for (let i = 0; i < ch; i++) data.push(new Float32Array(len));
    return { length: len, numberOfChannels: ch, getChannelData: (i) => data[i] };
  }
  createConvolver() { return node({ buffer: null }); }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
  }
  createDelay() { return node({ delayTime: param(0) }); }
  createStereoPanner() { return node({ pan: param(0) }); }
}

// fake timers
const timers = [];
globalThis.setInterval = (fn) => { timers.push(fn); return timers.length; };
globalThis.clearInterval = () => {};
globalThis.setTimeout = (fn) => 0;
globalThis.clearTimeout = () => {};
globalThis.window = globalThis;

// 1) No Web Audio available: everything must be a silent no-op.
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'audio.js'), 'utf8');
function load() { delete globalThis.MOW; vm.runInThisContext(src, { filename: 'audio.js' }); return globalThis.MOW.Audio; }
const SFX = ['swing', 'snip', 'clang', 'stall', 'sputter', 'refuel', 'coin', 'cash', 'pickup', 'gnome',
  'flower', 'click', 'buy', 'error', 'star', 'tired', 'fanfare'];

let A = load();
A.init(); A.startMusic(); A.setMode('play'); A.tool('gas', 0.5, true); SFX.forEach((n) => A[n](3));
assert.strictEqual(A.isReady(), false);
assert.strictEqual(A._lastError, null);

// 2) Mock context
globalThis.AudioContext = MockAudioContext;
A = load();
assert.strictEqual(A.isReady(), false);
A.startMusic(); // before running
A.init(); A.init();
A.setMode('menu'); A.setMusicVolume(0.5); A.setSfxVolume(0.6); A.setMuted(true); A.setMuted(false);
// run scheduler ticks (context becomes running after resume)
return_run();
function return_run() {
  Promise.resolve().then(() => {
    assert.strictEqual(A.isReady(), true);
    A.startMusic();
    for (let i = 0; i < 120; i++) { mockTime += 0.2; timers.forEach((f) => f()); }
    A.setMode('play');
    for (let i = 0; i < 60; i++) { mockTime += 0.2; timers.forEach((f) => f()); }
    for (const kind of ['scythe', 'reel', 'gas', 'ride', null, 'gas']) {
      for (let f = 0; f < 90; f++) {
        mockTime += 1 / 60;
        A.tool(kind, Math.abs(Math.sin(f / 15)), f % 2 === 0);
      }
    }
    for (let r = 0; r < 3; r++) {
      SFX.forEach((n) => { mockTime += 0.1; A[n](n === 'star' ? r : 4); });
    }
    for (let i = 0; i < 5; i++) A.star(i);
    A.snip(1); A.snip(20); A.snip();
    A.stopMusic();
    assert.strictEqual(A._lastError, null, 'audio threw: ' + (A._lastError && A._lastError.stack));
    console.log('audio smoke OK (' + nodeCount + ' mock nodes)');
  }).catch((e) => { console.error(e); process.exit(1); });
}
