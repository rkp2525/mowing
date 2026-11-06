/* Adapted from Sportsagent's local feedback sessions and review log. */
(function () {
const M = globalThis.MOW = globalThis.MOW || {};
const captureScreen = () => M.captureFeedbackScreen();

const FEEDBACK_CATEGORIES = [
  ['bug', 'Bug / unexpected behavior'],
  ['usability', 'Clarity / usability'],
  ['balance', 'Game balance / difficulty'],
  ['story', 'Story / realism'],
  ['idea', 'Feature / improvement idea'],
  ['positive', 'Something I liked'],
  ['other', 'Not sure / other'],
];
function feedbackCategory(value) {
  return FEEDBACK_CATEGORIES.find(([id]) => id === value) || FEEDBACK_CATEGORIES.at(-1);
}

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lawnkid-feedback', 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('reports'))
        db.createObjectStore('reports', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings'))
        db.createObjectStore('settings', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function reports(operation, value) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        'reports',
        operation === 'getAll' ? 'readonly' : 'readwrite',
      );
      const request = transaction.objectStore('reports')[operation](...(value ? [value] : []));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || Error('Feedback storage was interrupted.'));
    });
  } finally {
    db.close();
  }
}
const SESSION_IDLE_MS = 30 * 60 * 1000;
function feedbackSessions(saved) {
  const groups = new Map();
  let legacy;
  for (const report of [...saved].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    if (!report.sessionId) {
      if (!legacy || Date.parse(report.timestamp) - legacy.lastAt > SESSION_IDLE_MS) {
        legacy = {
          id: `legacy-${report.id}`,
          startedAt: report.timestamp,
          lastAt: Date.parse(report.timestamp),
        };
      }
      legacy.lastAt = Date.parse(report.timestamp);
    }
    const id = report.sessionId || legacy.id;
    if (report.deletedAt) continue;
    if (!groups.has(id))
      groups.set(id, { id, startedAt: report.sessionStartedAt || report.timestamp, reports: [] });
    groups.get(id).reports.push(report);
  }
  return [...groups.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
function selectedFeedback(saved, ids) {
  const selected = new Set(ids);
  return saved.filter((r) => !r.deletedAt && selected.has(r.id));
}
function sessionForReport(current, timestamp, id) {
  const at = Date.parse(timestamp);
  const last = Date.parse(current?.lastEntryAt || current?.startedAt);
  if (!current || at - last > SESSION_IDLE_MS) {
    return { key: 'session', id, startedAt: timestamp, lastEntryAt: timestamp };
  }
  return { ...current, lastEntryAt: new Date(Math.max(last, at)).toISOString() };
}
async function sessionTransaction(callback) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(['reports', 'settings'], 'readwrite');
      const settings = transaction.objectStore('settings');
      const store = transaction.objectStore('reports');
      let value;
      const request = settings.get('session');
      request.onsuccess = () => {
        value = callback(request.result, store, settings);
      };
      transaction.oncomplete = () => resolve(value);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || Error('Feedback storage interrupted.'));
    });
  } finally {
    db.close();
  }
}
async function saveFeedback(report) {
  return sessionTransaction((current, store, settings) => {
    const session = sessionForReport(current, report.timestamp, crypto.randomUUID());
    const saved = { ...report, sessionId: session.id, sessionStartedAt: session.startedAt };
    settings.put(session);
    store.put(saved);
    return saved;
  });
}
async function changeDeleted(entries, deletedAt) {
  return sessionTransaction((current, store) => {
    for (const entry of entries) {
      const updated = { ...entry };
      if (deletedAt) updated.deletedAt = deletedAt;
      else delete updated.deletedAt;
      store.put(updated);
    }
  });
}
function createFeedbackExport(saved, exportedAt = new Date().toISOString()) {
  return {
    schemaVersion: 1,
    type: 'mowing-feedback-session',
    exportedAt,
    reports: [...saved]
      .filter((report) => !report.deletedAt)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((report) => ({ ...report, category: feedbackCategory(report.category)[0] })),
  };
}
function downloadJson(value, filename) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function download(report) {
  downloadJson(
    { ...report, category: feedbackCategory(report.category)[0] },
    `mowing-feedback-${report.timestamp.replace(/[:.]/g, '-')}-${report.id.slice(0, 8)}.json`,
  );
}

function installFeedback({ snapshot, notify, freeze }) {
  const toolbar = document.createElement('div');
  toolbar.className = 'feedback-tools';
  toolbar.dataset.feedbackUi = '';
  toolbar.innerHTML =
    '<button type="button" id="feedback-capture" title="Capture this screen and write feedback">Feedback</button><button type="button" id="feedback-log" aria-label="Saved feedback">Log</button><span role="status" class="feedback-status"></span>';
  document.body.append(toolbar);
  const capture = toolbar.querySelector('#feedback-capture');
  const log = toolbar.querySelector('#feedback-log');
  const status = toolbar.querySelector('[role="status"]');
  const dialog = document.createElement('dialog');
  dialog.className = 'feedback-dialog';
  dialog.dataset.feedbackUi = '';
  document.body.append(dialog);
  let busy = false;
  let previousFocus;
  let draft;
  function close() {
    dialog.close();
    draft = null;
    freeze(false);
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    else capture.focus({ preventScroll: true });
  }
  function show(title) {
    dialog.innerHTML =
      '<div class="feedback-heading"><h2></h2><button type="button" aria-label="Close feedback">Close</button></div><div class="feedback-body"></div><p class="feedback-error" role="alert"></p>';
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('button').onclick = close;
    dialog.showModal();
    return dialog.querySelector('.feedback-body');
  }
  // Keep the game's Escape and Tab handlers from closing/changing the underlying modal.
  window.addEventListener(
    'keydown',
    (event) => {
      if (busy) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (dialog.open) {
        event.stopImmediatePropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          dialog.querySelector('form')?.requestSubmit();
        }
      }
    },
    true,
  );
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  capture.onclick = async () => {
    if (busy || dialog.open) return;
    previousFocus = document.activeElement;
    freeze(true);
    busy = true;
    capture.disabled = log.disabled = true;
    status.textContent = 'Capturing…';
    const app = document.querySelector('#app');
    const wasInert = app.inert;
    try {
      // Copy state before awaiting capture; never replace or close the game's modal.
      draft = {
        schemaVersion: 2,
        game: 'mowing',
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...structuredClone(snapshot()),
        viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY, devicePixelRatio },
        url: location.href,
        userAgent: navigator.userAgent,
      };
      app.inert = true;
      try { draft.screenshot = await captureScreen(); }
      catch (error) { draft.screenshot = null; draft.captureError = error.message || 'Screenshot unavailable'; }
      const body = show('Developer feedback');
      body.innerHTML =
        '<img class="feedback-preview" alt="Game screen captured before opening feedback"><form><label for="feedback-category">Feedback type</label><select id="feedback-category" name="category"></select><label for="feedback-narrative">What happened? What did you expect?</label><textarea id="feedback-narrative" required maxlength="10000" rows="4" placeholder="A quick note is enough…"></textarea><p class="small muted">Includes the screenshot when available, capture time, and game state. Saved on this browser for a future review session. Recording feedback does not approve changes. Download reports from Log.</p><div class="feedback-actions"><button type="button" class="feedback-download">Download instead</button><button type="submit" class="primary">Save feedback</button></div></form>';
      const preview = body.querySelector('img');
      if (draft.screenshot) preview.src = draft.screenshot;
      else { preview.remove(); const missing = document.createElement('p'); missing.className = 'feedback-capture-note'; missing.textContent = 'Screenshot unavailable. Your note and game context will still be saved.'; body.prepend(missing); }
      const form = body.querySelector('form');
      const narrative = body.querySelector('textarea');
      const category = body.querySelector('#feedback-category');
      for (const [id, label] of FEEDBACK_CATEGORIES) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = label;
        category.append(option);
      }
      category.value = 'other';
      const error = dialog.querySelector('[role="alert"]');
      const report = () => ({
        ...draft,
        category: category.value,
        narrative: narrative.value.trim(),
      });
      body.querySelector('.feedback-download').onclick = () => {
        if (!form.reportValidity()) return;
        if (!narrative.value.trim()) {
          narrative.focus();
          return;
        }
        download(report());
      };
      let saving = false;
      form.onsubmit = async (event) => {
        event.preventDefault();
        if (saving || !narrative.value.trim()) return;
        saving = true;
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        try {
          const savedReport = report();
          await saveFeedback(savedReport);
          if (draft?.id === savedReport.id) close();
          notify('Feedback saved. Open Log to review or download it.');
        } catch {
          error.textContent =
            'Could not save feedback in this browser. Your note is still here; use Download instead to keep the report.';
        } finally {
          saving = false;
          button.disabled = false;
        }
      };
      narrative.focus();
    } catch (error) {
      draft = null; freeze(false);
      notify(`Could not open feedback. Please try again. ${error.message || ''}`);
    } finally {
      app.inert = wasInert;
      busy = false;
      capture.disabled = log.disabled = false;
      status.textContent = '';
    }
  };
  log.onclick = async () => {
    if (busy || dialog.open) return;
    previousFocus = document.activeElement;
    freeze(true);
    const body = show('Saved feedback');
    body.textContent = 'Loading…';
    try {
      let saved = await reports('getAll');
      const legacyLatest = feedbackSessions(saved)[0];
      let current = await sessionTransaction((session, store, settings) => {
        if (session || !legacyLatest) return session || null;
        // Remember the latest legacy session even if all its entries are later deleted.
        const migrated = {
          key: 'session',
          id: legacyLatest.id,
          startedAt: legacyLatest.startedAt,
          lastEntryAt: legacyLatest.reports.at(-1).timestamp,
        };
        settings.put(migrated);
        return migrated;
      });
      let groupId = null;
      let selected = new Set();
      let trash = false;
      let undoIds = [];
      let mutating = false;
      const error = dialog.querySelector('[role="alert"]');
      function groups() {
        const sessions = feedbackSessions(saved);
        if (current && !sessions.some((s) => s.id === current.id))
          sessions.unshift({ id: current.id, startedAt: current.startedAt, reports: [] });
        return sessions.sort((a, b) =>
          a.id === current?.id
            ? -1
            : b.id === current?.id
              ? 1
              : b.startedAt.localeCompare(a.startedAt),
        );
      }
      function visible() {
        if (trash) return saved.filter((r) => r.deletedAt);
        if (groupId === 'all') return saved.filter((r) => !r.deletedAt);
        return groups().find((s) => s.id === groupId)?.reports || [];
      }
      function selectVisible() {
        selected = new Set(visible().map((r) => r.id));
      }
      groupId = groups()[0]?.id || null;
      selectVisible();
      function button(label, action, className = '') {
        const node = document.createElement('button');
        node.type = 'button';
        node.textContent = label;
        node.className = className;
        node.disabled = mutating;
        node.onclick = action;
        return node;
      }
      async function mutate(entries, deleting) {
        if (mutating || !entries.length) return;
        mutating = true;
        render();
        error.textContent = '';
        try {
          const deletedAt = deleting ? new Date().toISOString() : null;
          await changeDeleted(entries, deletedAt);
          undoIds = deleting ? entries.map((r) => r.id) : [];
          saved = await reports('getAll');
          selected = new Set([...selected].filter((id) => !entries.some((r) => r.id === id)));
          notify(
            deleting
              ? `${entries.length} feedback entry(s) moved to Trash. You can restore them.`
              : 'Feedback restored.',
          );
        } catch {
          error.textContent =
            'Could not update feedback. Your saved entries have not been removed.';
        } finally {
          mutating = false;
          render();
        }
      }
      function render() {
        if (!dialog.open || !body.isConnected) return;
        body.replaceChildren();
        const sessions = groups();
        const controls = document.createElement('div');
        controls.className = 'feedback-log-controls';
        if (groupId && groupId !== 'all' && !sessions.some((s) => s.id === groupId)) {
          const empty = {
            id: groupId,
            startedAt:
              saved.find((r) => r.sessionId === groupId || `legacy-${r.id}` === groupId)
                ?.timestamp || new Date().toISOString(),
            reports: [],
          };
          sessions.push(empty);
        }
        const sessionLabel = document.createElement('label');
        sessionLabel.textContent = 'Feedback session';
        const sessionSelect = document.createElement('select');
        sessionSelect.id = 'feedback-session';
        sessionSelect.disabled = trash || mutating;
        for (const [index, session] of sessions.entries()) {
          const option = document.createElement('option');
          option.value = session.id;
          option.textContent = `${index === 0 ? 'Most recent · ' : ''}${new Date(session.startedAt).toLocaleString()} · ${session.reports.length} entries`;
          sessionSelect.append(option);
        }
        const all = document.createElement('option');
        all.value = 'all';
        all.textContent = 'All saved sessions';
        sessionSelect.append(all);
        sessionSelect.value = groupId || 'all';
        sessionSelect.onchange = () => {
          groupId = sessionSelect.value;
          selectVisible();
          render();
        };
        sessionLabel.append(sessionSelect);
        controls.append(sessionLabel);
        controls.append(
          button('Start new session', async () => {
            if (mutating) return;
            mutating = true;
            render();
            try {
              current = await sessionTransaction((old, store, settings) => {
                const session = {
                  key: 'session',
                  id: crypto.randomUUID(),
                  startedAt: new Date().toISOString(),
                };
                settings.put(session);
                return session;
              });
              trash = false;
              groupId = current.id;
              selected.clear();
              notify('New feedback session started. Older feedback is still saved.');
            } catch {
              error.textContent = 'Could not start a new session. Please try again.';
            } finally {
              mutating = false;
              render();
            }
          }),
        );
        controls.append(
          button(
            trash ? 'Back to feedback' : `Trash (${saved.filter((r) => r.deletedAt).length})`,
            () => {
              trash = !trash;
              selected.clear();
              if (!trash) selectVisible();
              render();
            },
          ),
        );
        body.append(controls);
        const explanation = document.createElement('p');
        explanation.className = 'small muted';
        explanation.textContent = trash
          ? 'Deleted entries are excluded from every export. Select entries to restore them.'
          : 'The most recent session is selected when you open Log. Uncheck anything you do not want to share. Older sessions stay saved. A new session also starts after 30 minutes without a saved note.';
        body.append(explanation);
        const shown = visible().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const chosen = shown.filter((r) => selected.has(r.id));
        const actions = document.createElement('div');
        actions.className = 'feedback-log-actions';
        actions.append(
          button('Select all shown', () => {
            selectVisible();
            render();
          }),
        );
        actions.append(
          button('Unselect all', () => {
            selected.clear();
            render();
          }),
        );
        if (trash) {
          const restore = button(
            `Restore selected (${chosen.length})`,
            () => mutate(chosen, false),
            'primary',
          );
          restore.disabled ||= !chosen.length;
          actions.append(restore);
        } else {
          const exportButton = button(
            `Download selected (${chosen.length})`,
            () => {
              const bundle = createFeedbackExport(
                selectedFeedback(
                  saved,
                  chosen.map((r) => r.id),
                ),
              );
              downloadJson(
                bundle,
                `mowing-feedback-session-${bundle.exportedAt.replace(/[:.]/g, '-')}.json`,
              );
            },
            'primary',
          );
          exportButton.disabled ||= !chosen.length;
          const remove = button(
            `Delete selected (${chosen.length})`,
            () => mutate(chosen, true),
            'danger',
          );
          remove.disabled ||= !chosen.length;
          actions.append(exportButton, remove);
        }
        if (undoIds.length)
          actions.append(
            button('Undo delete', () =>
              mutate(
                saved.filter((r) => undoIds.includes(r.id)),
                false,
              ),
            ),
          );
        body.append(actions);
        const summary = document.createElement('p');
        summary.className = 'small muted';
        summary.setAttribute('role', 'status');
        summary.textContent = `${chosen.length} selected · ${shown.length} shown${trash ? '' : ` · ${saved.filter((r) => !r.deletedAt).length - shown.length} other saved entries kept`}`;
        body.append(summary);
        if (!shown.length) {
          const empty = document.createElement('p');
          empty.textContent = trash
            ? 'Trash is empty.'
            : 'No feedback in this session yet. Close Log and record a note.';
          body.append(empty);
        }
        for (const report of shown) {
          const item = document.createElement('article');
          item.className = 'feedback-report';
          item.dataset.reportId = report.id;
          const label = document.createElement('label');
          label.className = 'feedback-entry-selection';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = selected.has(report.id);
          checkbox.disabled = mutating;
          checkbox.setAttribute('aria-label', `Select feedback: ${report.narrative.slice(0, 100)}`);
          checkbox.onchange = () => {
            if (checkbox.checked) selected.add(report.id);
            else selected.delete(report.id);
            // Preserve keyboard focus when refreshing selection counts.
            render();
            body.querySelectorAll('.feedback-report').forEach((node) => {
              if (node.dataset.reportId === report.id)
                node.querySelector('input').focus({ preventScroll: true });
            });
          };
          const time = document.createElement('strong');
          time.textContent = new Date(report.timestamp).toLocaleString();
          label.append(checkbox, time);
          const category = document.createElement('div');
          category.className = 'feedback-category tag';
          category.textContent = feedbackCategory(report.category)[1];
          const note = document.createElement('p');
          note.textContent = report.narrative;
          const image = document.createElement('img');
          image.className = 'feedback-preview';
          image.alt = 'Captured game screen';
          if (report.screenshot) image.src = report.screenshot;
          else image.hidden = true;
          image.loading = 'lazy';
          const context = document.createElement('div'); context.className = 'feedback-context'; context.textContent = reportContext(report);
          item.append(
            label,
            context,
            category,
            note,
            image,
            button(
              trash ? 'Restore entry' : 'Delete entry',
              () => mutate([report], !trash),
              trash ? '' : 'danger',
            ),
          );
          body.append(item);
        }
      }
      render();
    } catch {
      body.textContent = 'Could not read saved feedback from this browser.';
    }
  };
}

function reportContext(report) {
  const context = report.context || {};
  return [context.lawn, context.equipment, context.screen, context.artStyle].filter(Boolean).join(' · ');
}
function serializeState(state) {
  if (!state) return null;
  // Omit only reproducible render caches. Convert typed arrays to portable JSON arrays.
  const { stripePatterns, dirty, kind, vr, tint, fences, bake, ...simulation } = state;
  return JSON.parse(JSON.stringify(simulation, (key, value) => typeof value === 'function' ? undefined : ArrayBuffer.isView(value) ? Array.from(value) : value));
}
M.Feedback = { install: installFeedback, feedbackSessions, selectedFeedback, sessionForReport, createFeedbackExport, serializeState, reportContext };
})();
