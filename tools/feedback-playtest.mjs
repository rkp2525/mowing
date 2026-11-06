// Chrome acceptance test using its built-in debugging pipe; no npm packages required.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile, readdir, rm } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(resolve(tmpdir(), 'mowing-feedback-'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + '/') || pathname.split('/').some(part => part.startsWith('.'))) { res.writeHead(403).end(); return; }
  try { const data = await readFile(file); res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); res.end(data); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/%`)).status, 400);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-pipe', `--user-data-dir=${temp}/profile`,
], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let sequence = 0, buffer = '', session;
const decoder = new StringDecoder('utf8');
const waiting = new Map(), events = [];
chrome.stdio[4].on('data', chunk => {
  buffer += decoder.write(chunk);
  for (let end; (end = buffer.indexOf('\0')) >= 0;) {
    const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
    if (message.id) {
      const request = waiting.get(message.id); if (!request) continue;
      waiting.delete(message.id); clearTimeout(request.timer);
      if (message.error) request.reject(Error(JSON.stringify(message.error))); else request.resolve(message.result);
    } else events.push(message);
  }
});
function command(method, params = {}, target = session) {
  return new Promise((resolve, reject) => {
    const id = ++sequence, timer = setTimeout(() => { waiting.delete(id); reject(Error('Timeout: ' + method)); }, 20000);
    waiting.set(id, { resolve, reject, timer });
    chrome.stdio[3].write(JSON.stringify({ id, method, params, ...(target ? { sessionId: target } : {}) }) + '\0');
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression, message = expression) {
  const deadline = Date.now() + 18000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  throw Error('Not ready: ' + message);
}
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const key = code => evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:${JSON.stringify(code)},key:${JSON.stringify(code === 'Escape' ? 'Escape' : code)},bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{code:${JSON.stringify(code)},key:${JSON.stringify(code === 'Escape' ? 'Escape' : code)},bubbles:true}));`);
async function screenshot(name) {
  const shot = await command('Page.captureScreenshot', { format: 'png' });
  await writeFile(resolve(temp, name), Buffer.from(shot.data, 'base64'));
}
async function download(label) {
  const before = new Set(await readdir(temp));
  await evaluate(`Array.from(document.querySelectorAll('.feedback-dialog button')).find(b=>b.textContent===${JSON.stringify(label)}).click()`);
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const files = (await readdir(temp)).filter(name => name.endsWith('.json') && !before.has(name));
    if (files.length) return JSON.parse(await readFile(resolve(temp, files[0]), 'utf8'));
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  throw Error('Download missing: ' + label);
}
const logButton = label => evaluate(`Array.from(document.querySelectorAll('.feedback-dialog button')).find(b=>b.textContent===${JSON.stringify(label)}).click()`);
async function readyLog(count) {
  await until(`document.querySelectorAll('.feedback-report').length===${count} && !!Array.from(document.querySelectorAll('.feedback-dialog button')).find(b=>b.textContent==='Download selected (${count})')`);
}
try {
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' }, null);
  ({ sessionId: session } = await command('Target.attachToTarget', { targetId, flatten: true }, null));
  await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
  await command('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: temp }, null);
  for (const width of [1280, 390]) {
    const startEvent = events.length;
    await command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 500 });
    await command('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?level=1&tool=gas&shot=1` });
    await until(`!!window.__G?.s && !!document.querySelector('#feedback-capture') && MOW.ArtStyles.ready('pixel')`);
    await evaluate(`new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('lawnkid-feedback');request.onsuccess=resolve;request.onerror=reject;})`);
    // Open the game's truck menu and capture it without replacing the underlying screen.
    await click('#hud-tool');
    await until(`getComputedStyle(document.querySelector('.screen')).opacity==='1' && document.querySelector('.panel').getAnimations().every(a=>a.playState==='finished')`);
    const before = await evaluate(`({mode:__G.mode,screen:document.querySelector('#screens').innerHTML,scroll:document.querySelector('.panel').scrollTop,time:__G.s.time,x:__G.s.p.x,grass:Array.from(__G.s.subGrass),progress:localStorage.getItem('lawnkid.v1')})`);
    await click('#feedback-capture');
    await until(`!!document.querySelector('#feedback-narrative')`);
    const capture = await evaluate(`({src:document.querySelector('.feedback-preview')?.src,category:document.querySelector('#feedback-category').value,mode:__G.mode,time:__G.s.time,screen:document.querySelector('#screens').innerHTML})`);
    assert.match(capture.src, /^data:image\/png;base64,/);
    const png = Buffer.from(capture.src.split(',')[1], 'base64');
    assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), 844); assert.ok(png.length > 10000);
    const menuPixels = await evaluate(`(async()=>{const image=new Image();image.src=${JSON.stringify(capture.src)};await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const g=canvas.getContext('2d');g.drawImage(image,0,0);let cream=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=g.getImageData(Math.round(image.width*(.4+x*.025)),Math.round(image.height*(.35+y*.025)),1,1).data;if(p[0]>240&&p[1]>220&&p[2]>180)cream++;}return cream;})()`);
    assert.ok(menuPixels > 20, 'captured image must contain the visible truck panel');
    assert.equal(capture.category, 'other'); assert.equal(capture.mode, before.mode); assert.equal(capture.time, before.time); assert.equal(capture.screen, before.screen);
    await writeFile(resolve(temp, `capture-${width}.png`), png); await screenshot(`feedback-${width}.png`);
    // A game input remains blocked while feedback is open.
    await key('KeyQ'); assert.equal(await evaluate('__G.s.tool'), 'gas');
    await evaluate(`document.querySelector('#feedback-category').value='usability';document.querySelector('#feedback-narrative').value='Truck layout note at ${width}px';`);
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', modifiers: 2 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', modifiers: 2 });
    await until(`!document.querySelector('.feedback-dialog').open`);
    const after = await evaluate(`({mode:__G.mode,screen:document.querySelector('#screens').innerHTML,time:__G.s.time,x:__G.s.p.x,grass:Array.from(__G.s.subGrass),progress:localStorage.getItem('lawnkid.v1')})`);
    assert.deepEqual(after, { mode: before.mode, screen: before.screen, time: before.time, x: before.x, grass: before.grass, progress: before.progress });
    await click('#feedback-log'); await readyLog(1);
    const bundle = await download('Download selected (1)');
    assert.equal(bundle.type, 'mowing-feedback-session'); assert.equal(bundle.reports.length, 1);
    const [report] = bundle.reports;
    assert.equal(report.screenshot, capture.src); assert.equal(report.category, 'usability');
    assert.equal(report.ui.mode, 'truck'); assert.equal(report.context.equipment, 'Gas Push Mower');
    assert.deepEqual(report.gameState.subGrass, before.grass);
    assert.match(await evaluate(`document.querySelector('.feedback-context').textContent`), /Mrs\. Albright.*Gas Push Mower.*truck.*pixel/i);
    await key('Escape');
    // Play must also freeze when a feedback Log is open over live mowing.
    await click('#b-back'); await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',key:'d',bubbles:true}))`);
    await until(`__G.s.started && __G.s.p.speed>0`);
    await click('#feedback-log'); await readyLog(1);
    await evaluate(`window.frozenState=JSON.stringify({p:__G.s.p,time:__G.s.time,remaining:__G.s.remaining});window.frozenCanvas=document.querySelector('#game').toDataURL()`);
    await new Promise(resolve => setTimeout(resolve, 220));
    assert.equal(await evaluate(`JSON.stringify({p:__G.s.p,time:__G.s.time,remaining:__G.s.remaining})===frozenState && document.querySelector('#game').toDataURL()===frozenCanvas`), true);
    await key('Escape');
    await command('Page.reload'); await until(`!!window.__G?.s && !!document.querySelector('#feedback-log')`);
    await click('#feedback-log'); await readyLog(1); await key('Escape');
    // Seed two more entries in a newer session to exercise selected export and recovery.
    await evaluate(`(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('lawnkid-feedback',2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const tx=db.transaction(['reports','settings'],'readwrite');const r=${JSON.stringify(report)},timestamp=new Date(Date.parse(r.timestamp)+60000).toISOString();for(const id of ['new-a','new-b'])tx.objectStore('reports').put({...r,id,sessionId:'latest',sessionStartedAt:timestamp,timestamp,narrative:id});tx.objectStore('settings').put({key:'session',id:'latest',startedAt:timestamp,lastEntryAt:timestamp});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()})()`);
    await click('#feedback-log'); await readyLog(2);
    await evaluate(`const cb=document.querySelectorAll('.feedback-entry-selection input')[1];cb.click()`);
    const selected = await download('Download selected (1)'); assert.deepEqual(selected.reports.map(r => r.id), ['new-a']);
    await logButton('Delete selected (1)'); await until(`document.querySelectorAll('.feedback-report').length===1`);
    await logButton('Undo delete'); await until(`document.querySelectorAll('.feedback-report').length===2`);
    await logButton('Select all shown'); await logButton('Delete selected (2)'); await readyLog(0); await key('Escape');
    await command('Page.reload'); await until(`!!window.__G?.s && !!document.querySelector('#feedback-log')`);
    await click('#feedback-log'); await readyLog(0);
    await logButton('Trash (2)'); await until(`document.querySelectorAll('.feedback-report').length===2`);
    await evaluate(`document.querySelector('.feedback-report button').click()`); await until(`document.querySelectorAll('.feedback-report').length===1`);
    await logButton('Back to feedback'); await readyLog(1); await logButton('Start new session'); await readyLog(0); await key('Escape');
    // Offline capture needs no request: canvas, computed styles, and embedded assets suffice.
    await until(`MOW.ArtStyles.ready('pixel')`);
    await command('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await click('#feedback-capture'); await until(`!!document.querySelector('#feedback-narrative')`);
    assert.match(await evaluate(`document.querySelector('.feedback-preview')?.src || ''`), /^data:image\/png;base64,/);
    await key('Escape'); await command('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    // Storage failure leaves the draft downloadable, with its screenshot and category intact.
    await evaluate(`indexedDB.open=()=>{throw Error('Storage unavailable')}`);
    await click('#feedback-capture'); await until(`!!document.querySelector('#feedback-narrative')`);
    await evaluate(`document.querySelector('#feedback-narrative').value='Keep draft after storage failure';document.querySelector('.feedback-dialog form').requestSubmit()`);
    await until(`document.querySelector('.feedback-error').textContent.includes('Could not save')`);
    const fallback = await download('Download instead'); assert.equal(fallback.narrative, 'Keep draft after storage failure'); assert.equal(fallback.category, 'other');
    await key('Escape');
    // Capture failure still allows a contextual note, then returns to the unchanged game.
    await evaluate(`MOW.captureFeedbackScreen=()=>Promise.reject(Error('Capture unavailable'))`);
    await click('#feedback-capture'); await until(`!!document.querySelector('#feedback-narrative')`);
    assert.equal(await evaluate(`!!document.querySelector('.feedback-capture-note')`), true);
    await evaluate(`document.querySelector('#feedback-narrative').value='Note without screenshot'`);
    const withoutImage = await download('Download instead'); assert.equal(withoutImage.screenshot, null); assert.equal(withoutImage.captureError, 'Capture unavailable'); assert.ok(withoutImage.gameState);
    await key('Escape'); assert.equal(await evaluate(`document.querySelector('#app').inert`), false);
    const errors = events.slice(startEvent).filter(event => event.method === 'Runtime.exceptionThrown');
    assert.deepEqual(errors, []);
    console.log(`${width}px PASS: capture, frozen state, truck menu, storage, selected export, sessions, Trash/Undo/Restore, reload, offline, and failure recovery`);
  }
  // Exercise the production input and pause/settings handlers with the shared browser fixture.
  await command('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/tools/control-browser.html?level=1&controlcheck=1&shot=1` });
  await until(`!!document.querySelector('pre[data-result]')`);
  assert.equal(await evaluate(`document.querySelector('pre[data-result]').dataset.result`), 'PASS', await evaluate(`document.querySelector('pre[data-result]').textContent`));
  await screenshot('controls-settings-trimmer.png');
  console.log('PASS: real keyboard/mouse controls, mid-level settings, trimmer, fertilizer, and restart');
  // Check preference persistence in the real non-dev entry point.
  await command('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await until(`!!document.querySelector('#b-set') && !!document.querySelector('#feedback-capture')`);
  await click('#b-set'); await click('#s-steering');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('lawnkid.v1')).easySteering`), false);
  await click('#b-ok'); await command('Page.reload'); await until(`!!document.querySelector('#b-set')`);
  await click('#b-set'); assert.equal(await evaluate(`document.querySelector('#s-steering').checked`), false);
  await click('#s-steering'); await click('#b-ok'); await click('#b-play');
  await until(`!!document.querySelector('#b-ok')`); await click('#b-ok');
  await click('.card[data-i="0"]');
  await until(`getComputedStyle(document.querySelector('.screen')).opacity==='1' && document.querySelector('.panel').getAnimations().every(a=>a.playState==='finished')`);
  await click('#feedback-capture'); await until(`!!document.querySelector('#feedback-narrative')`);
  await evaluate(`document.querySelector('#feedback-narrative').value='Selected lawn context'`);
  const brief = await download('Download instead');
  assert.equal(brief.ui.level, 0); assert.equal(brief.ui.dev, false); assert.equal(brief.context.lawn, "Mrs. Albright’s Front Yard");
  await key('Escape'); await click('#b-go'); await click('#hud-pause'); await click('#b-settings');
  assert.equal(await evaluate(`document.querySelector('#s-steering').checked`), true);
  const savedProgress = await evaluate(`localStorage.getItem('lawnkid.v1')`);
  await click('#feedback-capture'); await until(`!!document.querySelector('#feedback-narrative')`);
  await evaluate(`document.querySelector('#feedback-narrative').value='Settings during a job'`);
  const settings = await download('Download instead');
  assert.equal(settings.ui.mode, 'paused'); assert.match(settings.ui.screen, /Settings/);
  assert.equal(settings.progress.easySteering, true); assert.equal(settings.gameState.tool, 'reel');
  await key('Escape'); assert.equal(await evaluate(`localStorage.getItem('lawnkid.v1')`), savedProgress);
  await click('#b-ok'); assert.equal(await evaluate(`!!document.querySelector('#b-res')`), true); await click('#b-res');
  console.log('PASS: preferences survive reload, correct selected-lawn context, feedback from mid-level Settings, and progress preservation');
  await click('#hud-pause'); await click('#b-settings');
  await evaluate(`window.confirm=()=>true`); await click('#b-reset');
  assert.equal(await evaluate(`!!document.querySelector('.board') && !document.querySelector('#b-res')`), true);
  await key('Escape');
  const resetProgress = await evaluate(`JSON.parse(localStorage.getItem('lawnkid.v1'))`);
  assert.equal(resetProgress.money, 0); assert.deepEqual(resetProgress.stars, []); assert.deepEqual(resetProgress.best, []);
  await command('Page.reload'); await until(`!!document.querySelector('#b-play')`);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('lawnkid.v1')).money`), 0);
  console.log('PASS: mid-level reset discards active job, cannot resume, clears progress, and survives reload');
  console.log('Screenshots and downloaded fixtures: ' + temp);
} finally {
  await command('Browser.close', {}, null).catch(() => {});
  await new Promise(resolve => server.close(resolve));
  for (const request of waiting.values()) clearTimeout(request.timer);
  // Keep screenshots and reports for visual review; Chrome's temporary profile can be removed.
  await rm(resolve(temp, 'profile'), { recursive: true, force: true });
}
