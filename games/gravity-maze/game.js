(() => {
  'use strict';
  const G = window.Gravity, data = window.GravityLevels.levels, $ = id => document.getElementById(id);
  const canvas = $('board'), ctx = canvas.getContext('2d');
  const levels = data.map(G.compile), analyses = levels.map(G.analyze);
  const arrow = { U: '↑', D: '↓', L: '←', R: '→' };
  const colors = { U: '#aa554b', D: '#47739a', L: '#387b65', R: '#956e27' };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const assisted = new URLSearchParams(location.search).get('assisted') === '1';
  const storageKey = 'gravity-maze-human-v1-' + (assisted ? 'assisted' : 'blind');
  const qaLabels = new URLSearchParams(location.search).get('qa') === '1';
  const displayName = l => l.id === 'mass-6' ? 'MASS-6' : `${l.id.toUpperCase()} — ${l.name}`;
  const signature = JSON.stringify(data.map(l => [l.id, l.grid, l.objective]));
  let telemetryStorage; try { telemetryStorage = localStorage; } catch { telemetryStorage = { getItem() { throw Error('unavailable'); }, setItem() { throw Error('unavailable'); } }; }
  const logger = PlaytestTelemetry.create({ storage: telemetryStorage, signature, acceptHistorical: prior => SpatialMigration.compatible(prior, data) });
  let saved = { signature, active: 0, sessions: {}, completed: [], pace: 1 };
  try {
    const v = JSON.parse(localStorage.getItem(storageKey));
    if (v?.signature === signature) saved = { ...saved, ...v };
    else if (v?.signature && SpatialMigration.compatible(v.signature, data)) {
      const migrated = SpatialMigration.migrate(v, data, G.key);
      if (migrated) {
        try { localStorage.setItem(storageKey + '-before-spatial-v1', JSON.stringify(v)); } catch {}
        saved = { ...saved, ...migrated };
      }
    } else if (v?.signature) {
      const previous = JSON.parse(v.signature), current = JSON.parse(signature);
      // Adding unchanged rooms preserves existing progress, undo history and pace.
      if (Array.isArray(previous) && previous.length && previous.every(entry => current.some(now => JSON.stringify(now) === JSON.stringify(entry)))) {
        const activeId = previous[v.active]?.[0];
        saved = { ...saved, ...v, signature, active: Math.max(0, data.findIndex(l => l.id === activeId)) };
      }
    }
  } catch {}
  let index = 0, level, analysis, state, visual, history = [], moves = 0, anim = null;
  let hintCount = 0, hintText = '', suggested = null, ghost = null, pace = [1, 2, .65].includes(saved.pace) ? saved.pace : 1;
  let viewport = { width: 1, height: 1, cell: 1, x: 0, y: 0 };
  let menuOpen = false, frameRequested = false;
  let lastFrame = 0, activePointers = new Map(), blockedGesture = false;

  function persist() {
    saved.active = index; saved.pace = pace;
    saved.sessions[level.id] = { state: G.clone(state), history: history.map(h => ({ state: G.clone(h.state), moves: h.moves })), moves };
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
  }
  function cancelInput() { activePointers.clear(); blockedGesture = false; }
  function valid(s) { return s && analysis.index.has(G.key(s)); }
  function load(i, fresh = false) {
    setMenu(false);
    logger.busy(false);
    index = Math.max(0, Math.min(levels.length - 1, i)); level = levels[index]; analysis = analyses[index];
    const session = saved.sessions[level.id];
    if (!fresh && session && valid(session.state) && session.state.status !== 'won') {
      state = G.clone(session.state); moves = Number.isInteger(session.moves) ? session.moves : 0;
      history = (session.history || []).filter(h => valid(h.state)).slice(-120).map(h => ({ state: G.clone(h.state), moves: h.moves }));
    } else { state = G.clone(level.initial); history = []; moves = 0; }
    visual = G.clone(state); anim = null; hintCount = 0; hintText = ''; suggested = null; ghost = null;
    logger.enter(level.id, G.key(state), assisted ? 'assisted' : 'blind');
    cancelInput(); update(); resize(); persist();
  }
  function isDead() { return !analysis.canWin.has(analysis.index.get(G.key(state))); }
  function statusText() {
    if (anim) return 'Bereik de uitgang';
    if (state.status === 'loop') return 'Deze val blijft rondgaan. Met Terug herstel je de vorige beslissing.';
    if (hintText) return hintText;
    if (state.status === 'won') return 'De uitgang is bereikt.';
    return 'Bereik de uitgang';
  }
  function update() {
    $('level-number').textContent = `${index + 1} / ${levels.length}`;
    $('level-name').textContent = displayName(level);
    $('status').textContent = statusText();
    $('status-toast').hidden = !hintText && state.status !== 'loop';
    $('status-toast').textContent = statusText(); $('moves').textContent = `${moves} ${moves === 1 ? 'zet' : 'zetten'}`;
    $('undo').disabled = !history.length;
    const locked = !!anim || state.status !== 'rest';
    $('negative').disabled = locked; $('positive').disabled = locked;
    $('negative').classList.toggle('suggested', suggested === -1); $('positive').classList.toggle('suggested', suggested === 1);
    $('pace').innerHTML = `${pace === .65 ? '0,65' : pace}×<small>TEMPO</small>`;
    $('pace').setAttribute('aria-label', `Animatiesnelheid ${pace === .65 ? 'rustig' : pace + ' maal'}. Tik om te veranderen.`);
    const won = state.status === 'won' && !anim;
    const justWon = won && $('win').hidden;
    $('win').hidden = !won;
    $('win-title').textContent = 'De uitgang is bereikt.';
    $('win-note').textContent = `${level.name} · ${moves} zetten.`;
    $('next').textContent = index === levels.length - 1 ? 'Alle kamers bekijken' : 'Volgende kamer →';
    if (won && !saved.completed.includes(level.id)) { saved.completed.push(level.id); persist(); }
    if (justWon) $('next').focus({ preventScroll: true });
    updateDirections(visual.g); requestDraw();
  }
  function updateDirections(g) {
    const horizontal = g === 'D' || g === 'U';
    $('negative').querySelector('span').textContent = horizontal ? '←' : '↑';
    $('positive').querySelector('span').textContent = horizontal ? '→' : '↓';
    $('negative').setAttribute('aria-label', horizontal ? 'Beweeg naar links' : 'Beweeg omhoog');
    $('positive').setAttribute('aria-label', horizontal ? 'Beweeg naar rechts' : 'Beweeg omlaag');
    $('gravity').textContent = arrow[g]; $('gravity').style.color = colors[g];
    $('gravity').setAttribute('aria-label', `Zwaartekracht ${g === 'U' ? 'omhoog' : g === 'D' ? 'omlaag' : g === 'L' ? 'links' : 'rechts'}`);
  }
  function run(sign) {
    if (menuOpen) { setMenu(false); return; }
    if (anim || state.status !== 'rest' || document.querySelector('dialog[open]')) return;
    const result = G.step(level, state, sign);
    logger.event('move', { before: G.key(state), after: G.key(result.state), sign, changed: result.changed, errorBranch: analysis.canWin.has(analysis.index.get(G.key(state))) && !analysis.canWin.has(analysis.index.get(G.key(result.state))) });
    if (result.state.status === 'won') logger.complete();
    if (!result.changed) { $('status').textContent = 'Hier eindigt je vloer. Kies de andere richting.'; return; }
    const previous = G.clone(state); history.push({ state: previous, moves }); if (history.length > 120) history.shift();
    moves++; state = G.clone(result.state); suggested = null; ghost = null; hintText = ''; hintCount = 0;
    persist(); // A committed decision survives reloads, including during its animation.
    if (!reduced.matches) {
      const frames = [{ ...previous, event: 'rest' }, ...result.trace, { ...state, event: 'rest' }];
      let total = 0;
      const ends = frames.slice(1).map(f => { total += (f.event === 'trigger' ? 200 : f.event === 'portal' ? 330 : f.event === 'depart' ? 120 : f.event === 'fall' ? 90 : f.event === 'rest' ? 90 : 64) / pace; return total; });
      anim = { frames, ends, total, start: performance.now() }; logger.busy(true);
    } else { visual = G.clone(state); persist(); }
    update();
  }
  function undo() {
    logger.busy(false);
    if (!history.length) return;
    const h = history.pop();
    if (state.status === 'won') logger.enter(level.id, G.key(state), assisted ? 'assisted' : 'blind');
    logger.event('undo', { before: G.key(state), after: G.key(h.state) });
    state = G.clone(h.state); moves = h.moves; visual = G.clone(state); anim = null;
    hintText = ''; suggested = null; ghost = null; hintCount = 0; cancelInput(); update(); persist();
  }
  function reset() {
    logger.busy(false);
    if (state.status === 'won') logger.enter(level.id, G.key(state), assisted ? 'assisted' : 'blind');
    logger.event('reset', { before: G.key(state), after: G.key(level.initial) });
    if (G.key(state) !== G.key(level.initial) || moves) history.push({ state: G.clone(state), moves });
    state = G.clone(level.initial); visual = G.clone(state); moves = 0; anim = null;
    hintText = ''; suggested = null; ghost = null; hintCount = 0; cancelInput(); update(); persist();
  }
  function nextSign() {
    const initial = analysis.index.get(G.key(state));
    const queue = [{ at: initial, first: null }], seen = new Set([initial]);
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]; if (analysis.states[item.at].status === 'won') return item.first;
      for (const e of analysis.edges[item.at]) if (!seen.has(e.to)) { seen.add(e.to); queue.push({ at: e.to, first: item.first ?? e.sign }); }
    }
    return null;
  }
  function hint() {
    if (!assisted) return;
    if (anim || state.status === 'won') return;
    logger.event('hint');
    if (isDead()) { hintText = 'Vanuit deze toestand is er geen route meer naar de uitgang. Draai een beslissing terug.'; ghost = null; suggested = null; }
    else if (hintCount < 2) hintText = level.hints[hintCount++];
    else {
      suggested = nextSign(); ghost = G.step(level, state, suggested);
      const dir = state.g === 'U' || state.g === 'D' ? suggested < 0 ? 'links' : 'rechts' : suggested < 0 ? 'omhoog' : 'omlaag';
      hintText = `Volgende zet: ${dir}. De omtrekken tonen waar iedereen stopt.`;
    }
    update();
  }
  function menu() {
    setMenu(false);
    if (anim) finishAnimation();
    const list = $('level-list'); list.replaceChildren();
    levels.forEach((l, i) => {
      const b = document.createElement('button'); b.classList.toggle('selected', i === index); b.dataset.level = String(i);
      const n = document.createElement('span'); n.className = 'number'; n.textContent = saved.completed.includes(l.id) ? '✓' : String(i + 1);
      const title = document.createElement('strong'); title.textContent = displayName(l);
      const sub = document.createElement('small'); sub.textContent = l.tier === 2 ? 'Tier 2 · kandidaat' : 'Basislevel';
      b.append(n, title, sub); b.onclick = () => { $('selection').close(); load(i); canvas.focus({ preventScroll: true }); };
      list.append(b);
    });
    logger.pause(); cancelInput(); $('selection').showModal();
  }
  function setMenu(open, focus = false) {
    if (menuOpen === open) return;
    menuOpen = open; cancelInput();
    if (open && anim) finishAnimation();
    document.querySelector('.play').classList.toggle('menu-open', open);
    $('top-menu').inert = !open;
    $('menu-handle').setAttribute('aria-expanded', String(open));
    $('menu-handle').setAttribute('aria-label', open ? 'Sluit spelmenu' : 'Open spelmenu');
    if (open) logger.pause();
    else if (!document.hidden && !menuOpen && document.hasFocus() && !document.querySelector('dialog[open]')) logger.resume();
    if (focus) (open ? $('level-menu') : $('menu-handle')).focus({ preventScroll: true });
  }
  $('menu-handle').onclick = () => setMenu(!menuOpen, true);
  $('menu-close').onclick = () => setMenu(false, true);
  canvas.addEventListener('pointerdown', () => setMenu(false));
  let menuStartY = null, menuSwiped = false;
  document.addEventListener('pointerdown', () => { menuSwiped = false; }, true);
  $('top-menu').addEventListener('pointerdown', e => { menuStartY = e.clientY; });
  window.addEventListener('pointermove', e => {
    if (menuOpen && menuStartY !== null && e.clientY < menuStartY - 24) {
      menuSwiped = true; menuStartY = null; setMenu(false);
    }
  });
  for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, () => { menuStartY = null; });
  document.addEventListener('click', e => { if (menuSwiped) { menuSwiped = false; if (e.detail !== 0) { e.preventDefault(); e.stopImmediatePropagation(); } } }, true);
  $('level-menu').onclick = menu; $('undo').onclick = undo; $('reset').onclick = () => { setMenu(false); reset(); }; $('hint').onclick = () => { setMenu(false); hint(); };
  $('hint').hidden = !assisted;
  document.body.dataset.mode = assisted ? 'assisted' : 'blind';
  function exportLog() { const blob = new Blob([JSON.stringify(logger.exportData(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'gravity-human-playtest.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  $('export').onclick = exportLog;
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('close', () => { if (!menuOpen && !document.hidden && document.hasFocus()) logger.resume(); }));
  $('next').onclick = () => { if (index === levels.length - 1) menu(); else load(index + 1); };
  $('replay').onclick = () => { reset(); canvas.focus({ preventScroll: true }); };
  $('help').onclick = () => { setMenu(false); cancelInput(); if (anim) finishAnimation(); logger.pause(); $('instructions').showModal(); };
  $('pace').onclick = () => { pace = pace === 1 ? 2 : pace === 2 ? .65 : 1; saved.pace = pace; if (!anim) persist(); update(); };
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $(b.dataset.close).close());

  // One complete pointer gesture = one decision. Two simultaneous thumbs = neutral.
  for (const [id, sign] of [['negative', -1], ['positive', 1]]) {
    const b = $(id);
    b.addEventListener('pointerdown', e => {
      if (e.button !== 0 || b.disabled) return;
      e.preventDefault(); b.setPointerCapture(e.pointerId); activePointers.set(e.pointerId, sign);
      if (activePointers.size > 1) blockedGesture = true;
    });
    b.addEventListener('pointerup', e => {
      const picked = activePointers.get(e.pointerId); activePointers.delete(e.pointerId);
      const blocked = blockedGesture; if (!activePointers.size) blockedGesture = false;
      if (picked && !blocked) run(picked);
    });
    b.addEventListener('pointercancel', e => { activePointers.delete(e.pointerId); blockedGesture = true; if (!activePointers.size) blockedGesture = false; });
    b.addEventListener('lostpointercapture', e => { activePointers.delete(e.pointerId); if (!activePointers.size) blockedGesture = false; });
    b.addEventListener('click', e => { if (e.detail === 0) run(sign); });
  }
  const keys = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', a: 'L', d: 'R', w: 'U', s: 'D' };
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape' && menuOpen) { e.preventDefault(); setMenu(false, true); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keys[k]) {
      e.preventDefault(); if (e.repeat || anim) return;
      const dir = keys[k], horizontal = state.g === 'U' || state.g === 'D';
      if (horizontal && (dir === 'L' || dir === 'R')) run(dir === 'L' ? -1 : 1);
      else if (!horizontal && (dir === 'U' || dir === 'D')) run(dir === 'U' ? -1 : 1);
    } else if (k === 'z') { e.preventDefault(); if (!e.repeat) undo(); }
    else if (k === 'r') { e.preventDefault(); if (!e.repeat) reset(); }
    else if (k === 'h') { e.preventDefault(); if (!e.repeat) hint(); }
  });
  window.addEventListener('blur', () => { cancelInput(); logger.pause(); });
  window.addEventListener('focus', () => { if (!menuOpen && !document.hidden && !document.querySelector('dialog[open]')) { logger.resume(); if (anim) logger.busy(true); } });
  setInterval(() => logger.save(), 10000);
  window.addEventListener('pagehide', () => { logger.pause(); persist(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { logger.pause(); cancelInput(); if (anim) finishAnimation(); persist(); } else if (!menuOpen && document.hasFocus() && !document.querySelector('dialog[open]')) logger.resume(); });

  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function label(text, x, y, size, color, align = 'center') {
    ctx.font = `500 ${size}px system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y);
  }
  function rounded(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function drawMass(s, outline = false) {
    const ms = s._visualMasses || G.bodies(s);
    ms.forEach((b, i) => drawOneMass({ mx: b.x, my: b.y, massOpacity: b.opacity ?? 1 }, outline, i));
  }
  function drawOneMass(s, outline = false, id = 0) {
    ctx.save(); ctx.globalAlpha = outline ? .85 : s.massOpacity ?? 1;
    ctx.lineWidth = .065; ctx.strokeStyle = '#514639';
    if (outline) { ctx.setLineDash([.15,.12]); ctx.strokeStyle='#ba842e'; ctx.strokeRect(s.mx+.06,s.my+.06,1.88,1.88); }
    else { ctx.fillStyle='#b69a76'; ctx.fillRect(s.mx+.02,s.my+.02,1.96,1.96); ctx.strokeRect(s.mx+.04,s.my+.04,1.92,1.92);
      line(s.mx+.13,s.my+.14,s.mx+1.87,s.my+.14,'#d3bda0',.10);
      line(s.mx+.1,s.my+1.85,s.mx+1.9,s.my+1.85,'#7e6850',.16);
    }
    if (qaLabels && G.bodies(state).length > 1) label(id === 0 ? 'A' : 'B', s.mx + 1, s.my + 1.25, .6, '#514639');
    ctx.restore();
  }
  function drawPlayer(s, opacity = 1, outline = false) {
    ctx.save(); ctx.translate(s.x + .5, s.y + .5); ctx.rotate({ D: 0, U: Math.PI, L: Math.PI / 2, R: -Math.PI / 2 }[s.g]); ctx.globalAlpha = opacity;
    ctx.lineWidth = .045;
    if (outline) { ctx.setLineDash([.09, .09]); ctx.strokeStyle = '#bd852d'; ctx.strokeRect(-.24, -.32, .48, .64); }
    else {
      ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = '#39443e'; ctx.beginPath(); ctx.roundRect(-.23, -.33, .46, .66, .13); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#39443e'; ctx.fillRect(-.135, -.15, .27, .15); ctx.fillStyle = '#d4dcbc'; ctx.fillRect(-.085, -.12, .06, .07); ctx.fillRect(.035, -.12, .06, .07);
      line(-.17, .39, .17, .39, colors[s.g], .065);
    }
    ctx.restore();
  }
  function draw(now) {
    const { width, height, cell, x: ox, y: oy } = viewport;
    const dpr = canvas.width / Math.max(1, width);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#e8e5dc'; ctx.fillRect(0, 0, width, height);
    ctx.translate(ox, oy); ctx.scale(cell, cell);
    // Quiet graph-paper void. Collision silhouettes stay dominant.
    ctx.fillStyle = '#f3f0e5'; ctx.fillRect(0, 0, level.w, level.h);
    for (let y = 1; y < level.h; y++) for (let x = 1; x < level.w; x++) {
      if (level.solid(x, y)) continue;
      ctx.fillStyle = '#82918725'; ctx.fillRect(x + .48, y + .48, .04, .04);
    }
    ctx.fillStyle = '#46524d';
    level.walls.forEach(key => { const [x, y] = key.split(',').map(Number); ctx.fillRect(x, y, 1.005, 1.005); });
    level.walls.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      if (!level.solid(x, y - 1)) line(x, y + .035, x + 1, y + .035, '#839782', .05);
      if (!level.solid(x, y + 1)) line(x, y + .965, x + 1, y + .965, '#839782', .05);
      if (!level.solid(x - 1, y)) line(x + .035, y, x + .035, y + 1, '#738976', .05);
      if (!level.solid(x + 1, y)) line(x + .965, y, x + .965, y + 1, '#738976', .05);
    });
    // Portals are recessed architectural openings rather than flat purple markers.
    // Keep the effect static/lightweight so it remains cheap on low-end phones.
    for (const p of Object.values(level.portals)) {
      const left = p.x === 0;
      const px = p.x, py = p.y;

      ctx.save();

      // Socket/frame: deliberately uses the wall palette so the opening feels built in.
      ctx.fillStyle = '#4c5853';
      ctx.fillRect(px, py, 1, 2);

      // Small bevels where the surrounding wall meets the opening.
      line(px + .03, py + .06, px + .97, py + .06, '#84968a', .06);
      line(px + .03, py + 1.94, px + .97, py + 1.94, '#303b37', .065);

      // Recessed cavity. The asymmetric inset makes the portal read as a passage
      // that opens toward the playable room rather than as a tile painted on top.
      const cavityX = left ? px + .09 : px + .07;
      const cavityY = py + .13;
      const cavityW = .84;
      const cavityH = 1.74;
      ctx.fillStyle = '#2f3937';
      ctx.beginPath();
      ctx.roundRect(cavityX, cavityY, cavityW, cavityH, .07);
      ctx.fill();

      // Mauve energy membrane, intentionally muted to stay within the earth palette.
      const fieldX = left ? px + .14 : px + .13;
      const fieldY = py + .18;
      const fieldW = .72;
      const fieldH = 1.64;
      const gradient = ctx.createLinearGradient(fieldX, fieldY, fieldX + fieldW, fieldY);
      if (left) {
        gradient.addColorStop(0, '#776886');
        gradient.addColorStop(.24, '#a89ab4');
        gradient.addColorStop(.52, '#d8d0dc');
        gradient.addColorStop(.78, '#a99bb5');
        gradient.addColorStop(1, '#7b6988');
      } else {
        gradient.addColorStop(0, '#7b6988');
        gradient.addColorStop(.22, '#a99bb5');
        gradient.addColorStop(.48, '#d8d0dc');
        gradient.addColorStop(.76, '#a89ab4');
        gradient.addColorStop(1, '#776886');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(fieldX, fieldY, fieldW, fieldH, .045);
      ctx.fill();

      // Inner rim: one shadow edge plus one quiet highlight gives depth without neon glow.
      const roomEdge = left ? fieldX + fieldW : fieldX;
      line(roomEdge, fieldY + .02, roomEdge, fieldY + fieldH - .02, '#665775', .055);
      line(roomEdge + (left ? -.055 : .055), fieldY + .05,
           roomEdge + (left ? -.055 : .055), fieldY + fieldH - .05, '#eee8ef99', .025);

      // Three restrained light filaments make the membrane feel active while staying static.
      for (const t of [.30, .50, .70]) {
        const fx = fieldX + fieldW * t;
        line(fx, fieldY + .16, fx, fieldY + fieldH - .16, '#f1ecf2aa', .025);
      }

      // Paired portal signature: short end caps point into the room and replace the old brackets.
      const capX = left ? px + .82 : px + .18;
      const capDir = left ? -.18 : .18;
      line(capX, py + .30, capX + capDir, py + .30, '#6f5d7e', .045);
      line(capX, py + 1.70, capX + capDir, py + 1.70, '#6f5d7e', .045);

      // A narrow floor-facing seam anchors the portal to the wall geometry.
      line(left ? px + .94 : px + .06, py + .18,
           left ? px + .94 : px + .06, py + 1.82, '#9aa79e66', .025);

      ctx.restore();
    }
    drawMass(visual);
    // Fixed world markers remain visible when covered by the mass.
    const ex = level.exit.x, ey = level.exit.y, ready = true;
    ctx.fillStyle = ready ? '#b8c9a8' : '#c3b9a4'; ctx.strokeStyle = ready ? '#4d7859' : '#84734f'; ctx.lineWidth = .045;
    ctx.beginPath(); ctx.roundRect(ex + .18, ey + .12, .64, .78, [.3, .3, .02, .02]); ctx.fill(); ctx.stroke();
    line(ex + .33, ey + .76, ex + .33, ey + .4, '#527759', .045);
    line(ex + .49, ey + .76, ex + .49, ey + .34, '#527759', .045);
    line(ex + .65, ey + .76, ex + .65, ey + .4, '#527759', .045);

    for (const t of level.triggers) {
      const x = t.x + .5, y = t.y + .5, gone = !!(visual.m & (1 << t.id));
      ctx.save(); ctx.translate(x, y);
      if (gone) {
        ctx.strokeStyle = '#a0aaa080'; ctx.lineWidth = .035; ctx.setLineDash([.06, .08]); ctx.beginPath(); ctx.arc(0, 0, .26, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); line(-.07, 0, .07, 0, '#9ca89a', .04);
      } else {
        ctx.fillStyle = colors[t.g]; ctx.beginPath();
        if (t.g === 'D') ctx.arc(0, 0, .37, 0, Math.PI * 2);
        else if (t.g === 'U') { ctx.moveTo(0, -.44); ctx.lineTo(.4, 0); ctx.lineTo(0, .44); ctx.lineTo(-.4, 0); ctx.closePath(); }
        else if (t.g === 'L') ctx.roundRect(-.35, -.35, .7, .7, .07);
        else { for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; i ? ctx.lineTo(Math.cos(a) * .41, Math.sin(a) * .41) : ctx.moveTo(Math.cos(a) * .41, Math.sin(a) * .41); } ctx.closePath(); }
        ctx.fill(); label(arrow[t.g], 0, .22, .62, '#fffdf5');
      }
      ctx.restore();
    }
    if (ghost && !anim) {
      ctx.strokeStyle = '#ba842e'; ctx.lineWidth = .055; ctx.setLineDash([.12, .12]); ctx.beginPath(); ctx.moveTo(state.x + .5, state.y + .5);
      ghost.trace.forEach(p => { if (p.event === 'portal') ctx.moveTo(p.x + .5, p.y + .5); else ctx.lineTo(p.x + .5, p.y + .5); });
      ctx.stroke(); ctx.setLineDash([]); drawPlayer(ghost.state, .8, true); drawMass(ghost.state, true);
    }
    drawPlayer(visual, visual.opacity ?? 1);
    if (visual.event === 'trigger' && !reduced.matches) {
      ctx.strokeStyle = `${colors[visual.g]}70`; ctx.lineWidth = .035; ctx.beginPath(); ctx.arc(visual.x + .5, visual.y + .5, .58, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function finishAnimation() {
    logger.busy(false);
    anim = null; visual = G.clone(state); update(); persist();
  }
  function requestDraw() { if (!frameRequested) { frameRequested = true; requestAnimationFrame(frame); } }
  function frame(now) {
    frameRequested = false;
    if (anim) {
      const elapsed = now - anim.start;
      if (elapsed >= anim.total) finishAnimation();
      else {
        let i = anim.ends.findIndex(t => t > elapsed); if (i < 0) i = anim.ends.length - 1;
        const from = anim.frames[i], to = anim.frames[i + 1], start = i ? anim.ends[i - 1] : 0;
        const u = (elapsed - start) / (anim.ends[i] - start);
        const fm = G.bodies(from), tm = G.bodies(to);
        if (to.event === 'portal') {
          const transit = Array.isArray(to.massPortal) ? to.massPortal : [!!to.massPortal];
          visual = { ...to, x: to.playerPortal && u < .5 ? from.x : to.x, y: to.playerPortal && u < .5 ? from.y : to.y, opacity: to.playerPortal ? Math.abs(u - .5) * 2 : 1,
            _visualMasses: tm.map((m, j) => ({ x: transit[j] && u < .5 ? fm[j].x : m.x, y: transit[j] && u < .5 ? fm[j].y : m.y, opacity: transit[j] ? Math.abs(u - .5) * 2 : 1 })) };
        } else visual = { ...to, x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u,
          _visualMasses: tm.map((m, j) => ({ x: fm[j].x + (m.x - fm[j].x) * u, y: fm[j].y + (m.y - fm[j].y) * u })) };
        if (visual.g !== from.g || !lastFrame) updateDirections(visual.g);
      }
    }
    draw(now); lastFrame = now; if (anim) requestDraw();
  }
  function resize() {
    cancelInput(); const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const cell = Math.max(1, Math.min(rect.width / level.w, (rect.height - 24) / level.h, 56));
    viewport = { width: rect.width, height: rect.height, cell, x: (rect.width - level.w * cell) / 2, y: (rect.height - level.h * cell) / 2 };
    requestDraw();
  }
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener('orientationchange', cancelInput);
  window.gravityPrototype = Object.freeze({
    snapshot: () => ({ level: level.id, index, state: G.clone(state), moves, busy: !!anim, undo: history.length, completed: [...saved.completed] }),
    diagnostics: () => ({ ...analysis.stats, cellCSS: viewport.cell, total: levels.length, grid: [level.w, level.h], board: { x: viewport.x, y: viewport.y, width: level.w * viewport.cell, height: level.h * viewport.cell }, menuOpen }),
    telemetry: () => logger.exportData()
  });
  const requested = levels.findIndex(l => l.id === new URLSearchParams(location.search).get('level'));
  load(requested >= 0 ? requested : Number.isInteger(saved.active) ? saved.active : 0); requestDraw();
})();
