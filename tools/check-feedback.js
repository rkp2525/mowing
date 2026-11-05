const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const M = require('./load.js');
vm.runInThisContext(fs.readFileSync(require('node:path').join(__dirname, '../js/feedback.js'), 'utf8'));
const { createFeedbackExport } = M.Feedback;

test('session export includes all reports with screenshots and game context, oldest first', () => {
  const older = {
    id: 'old',
    timestamp: '2026-10-29T16:10:00.000Z',
    narrative: 'Naming idea',
    screenshot: 'data:image/png;base64,older',
    gameState: null,
    ui: { modal: null },
    category: 'idea',
  };
  const newer = {
    id: 'new',
    timestamp: '2026-10-29T17:10:00.000Z',
    narrative: 'Confusing modal',
    screenshot: 'data:image/png;base64,newer',
    gameState: { p: { x: 3, y: 4 } },
    ui: { modal: 'settings' },
    category: 'usability',
  };
  const saved = [newer, older];
  const exportedAt = '2026-10-29T18:00:00.000Z';
  const bundle = JSON.parse(JSON.stringify(createFeedbackExport(saved, exportedAt)));
  assert.equal(bundle.type, 'mowing-feedback-session');
  assert.equal(bundle.exportedAt, exportedAt);
  assert.deepEqual(bundle.reports, [older, newer]);
  assert.deepEqual(saved, [newer, older], 'export does not reorder or remove saved feedback');
});

test('legacy uncategorized reports are included without changing the original', () => {
  const legacy = {
    id: 'legacy',
    timestamp: '2026-10-29T16:10:00.000Z',
    narrative: 'First feedback',
    screenshot: 'data:image/png;base64,legacy',
  };
  assert.deepEqual(createFeedbackExport([legacy]).reports, [{ ...legacy, category: 'other' }]);
  assert.equal(legacy.category, undefined);
  assert.deepEqual(createFeedbackExport([]).reports, []);
});

test('sessions retain older reports while grouping the latest recording session separately', async () => {
  const { feedbackSessions } = M.Feedback;
  const saved = [
    {
      id: 'old',
      timestamp: '2026-10-29T10:00:00.000Z',
      sessionId: 'first',
      sessionStartedAt: '2026-10-29T10:00:00.000Z',
    },
    {
      id: 'new-a',
      timestamp: '2026-10-29T11:00:00.000Z',
      sessionId: 'second',
      sessionStartedAt: '2026-10-29T11:00:00.000Z',
    },
    {
      id: 'new-b',
      timestamp: '2026-10-29T11:01:00.000Z',
      sessionId: 'second',
      sessionStartedAt: '2026-10-29T11:00:00.000Z',
    },
  ];
  const groups = feedbackSessions(saved);
  assert.equal(groups[0].id, 'second');
  assert.deepEqual(
    groups[0].reports.map((r) => r.id),
    ['new-a', 'new-b'],
  );
  assert.equal(groups[1].reports[0].id, 'old');
  assert.equal(saved.length, 3);
});

test('unselected, older, and deleted feedback stay out of the selected export', async () => {
  const { selectedFeedback } = M.Feedback;
  const saved = ['old', 'new-a', 'new-b', 'deleted'].map((id, i) => ({
    id,
    timestamp: `2026-10-29T11:0${i}:00.000Z`,
    narrative: id,
    screenshot: `image-${id}`,
    ...(id === 'deleted' ? { deletedAt: '2026-10-29T12:00:00.000Z' } : {}),
  }));
  const before = structuredClone(saved);
  const selected = selectedFeedback(saved, ['new-b', 'deleted', 'missing']);
  const bundle = createFeedbackExport(selected);
  assert.deepEqual(
    bundle.reports.map((r) => r.id),
    ['new-b'],
  );
  assert.equal(bundle.reports[0].screenshot, 'image-new-b');
  assert.deepEqual(saved, before);
  assert.equal(
    createFeedbackExport(saved).reports.some((r) => r.id === 'deleted'),
    false,
  );
});

test('legacy reports are grouped by recording gaps and deleted reports never become a session', async () => {
  const { feedbackSessions } = M.Feedback;
  const saved = [
    { id: 'first', timestamp: '2026-10-29T10:00:00.000Z' },
    { id: 'second', timestamp: '2026-10-29T10:15:00.000Z' },
    { id: 'last', timestamp: '2026-10-29T11:00:00.000Z' },
    { id: 'gone', timestamp: '2026-10-30T11:00:00.000Z', deletedAt: '2026-10-30T12:00:00.000Z' },
  ];
  const groups = feedbackSessions(saved);
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups[0].reports.map((r) => r.id),
    ['last'],
  );
  assert.deepEqual(
    groups[1].reports.map((r) => r.id),
    ['first', 'second'],
  );
});

test('session identity survives reloads and changes after inactivity or an explicit new session', async () => {
  const { sessionForReport } = M.Feedback;
  const first = sessionForReport(null, '2026-10-29T10:00:00.000Z', 'one');
  const continued = sessionForReport(
    JSON.parse(JSON.stringify(first)),
    '2026-10-29T10:10:00.000Z',
    'unused',
  );
  assert.equal(continued.id, 'one');
  assert.equal(continued.startedAt, first.startedAt);
  const afterIdle = sessionForReport(continued, '2026-10-29T11:00:00.000Z', 'two');
  assert.equal(afterIdle.id, 'two');
  const explicit = { key: 'session', id: 'manual', startedAt: '2026-10-29T11:01:00.000Z' };
  assert.equal(sessionForReport(explicit, '2026-10-29T11:02:00.000Z', 'unused').id, 'manual');
});

test('Mowing snapshots preserve simulation arrays and clip/treatment state as portable JSON', () => {
  const state = M.Sim.create(2, { tool: 'gas', tools: { reel: true, gas: true }, upgrades: {} }, 'gas');
  const flower = state.ents.find(e => e.t === 'flower'); flower.stems[0].clipped = true;
  state.roughPatches[0].samples[0].treated = true;
  state.stripePatterns[0] = [{ direction: 1, pattern: 'cached' }];
  const snapshot = M.Feedback.serializeState(state);
  assert.deepEqual(snapshot.subGrass, Array.from(state.subGrass));
  assert.deepEqual(snapshot.subDir, Array.from(state.subDir));
  assert.equal(snapshot.ents.find(e => e.t === 'flower').stems[0].clipped, true);
  assert.equal(snapshot.roughPatches[0].samples[0].treated, true);
  assert.equal(snapshot.lv.def.name, state.lv.def.name);
  assert.equal(snapshot.lv.def.build, undefined);
  assert.equal(snapshot.stripePatterns, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(structuredClone(snapshot))), snapshot);
  state.subGrass.fill(0); assert.ok(snapshot.subGrass.some(Boolean));
});
test('Log context identifies lawn, equipment, game screen, and art style', () => {
  assert.equal(M.Feedback.reportContext({ context: { lawn: 'Maple', equipment: 'Fertilizer', screen: 'truck', artStyle: 'pixel' } }), 'Maple · Fertilizer · truck · pixel');
  assert.equal(M.Feedback.reportContext({}), '');
});
