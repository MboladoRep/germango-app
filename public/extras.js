/* Germango extras v2: scroll a la lección actual, botón "Siguiente lección",
   tarjetas ES -> DE dentro del mapa (nodo 🃏 de repaso por unidad) y como modo aparte (🃏 de la cabecera). */
(function () {
  /* 1) Al volver al mapa, centrar la lección actual */
  const goCurrent = () => requestAnimationFrame(() => {
    const n = document.querySelector('.lesson-node.current');
    if (n) n.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  const mapEl = document.getElementById('screen-map');
  new MutationObserver(() => { if (mapEl.classList.contains('active')) goCurrent(); })
    .observe(mapEl, { attributes: true, attributeFilter: ['class'] });
  goCurrent();

  /* 2) Botón "Siguiente lección" en la pantalla de resultado */
  const res = document.getElementById('screen-result');
  const old = res.querySelector('button');
  old.textContent = 'VOLVER AL MAPA';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-main active';
  nextBtn.style.marginBottom = '10px';
  nextBtn.textContent = 'SIGUIENTE LECCIÓN';
  nextBtn.onclick = () => {
    const n = document.querySelector('.lesson-node.current');
    if (n && state.hearts > 0) n.click(); else exitToMap();
  };
  res.insertBefore(nextBtn, old);

  /* 3) Tarjetas */
  const LABELS = { greetings: 'Saludos', family: 'Familia', food: 'Comida', animals: 'Animales', numbers: 'Números', time: 'Tiempo', colors: 'Colores', verbs: 'Verbos', body: 'Cuerpo', house: 'Casa', weather: 'Clima', transport: 'Transporte', professions: 'Profesiones' };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => s.toLowerCase().replace(/[.,!?¿¡]/g, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();

  const DONE_KEY = 'germango_cards_done';
  const getDone = () => { try { const value = JSON.parse(localStorage.getItem(DONE_KEY)); return Array.isArray(value) ? value : []; } catch (e) { return []; } };
  const markDone = id => { try { const d = getDone(); if (!d.includes(id)) { d.push(id); localStorage.setItem(DONE_KEY, JSON.stringify(d)); } } catch (e) {} };

  const scr = document.createElement('div');
  scr.id = 'screen-cards';
  scr.className = 'screen';
  document.getElementById('app').appendChild(scr);

  let deck = [], checked = false, lastOk = false;

  /* Modo aparte: elegir tema */
  function picker() {
    showScreen('screen-cards');
    scr.innerHTML = '<h2 tabindex="-1" style="text-align:center;margin-bottom:6px">Tarjetas de alemán</h2><p style="text-align:center;color:var(--text-dim);margin-bottom:15px">Elige un tema para practicar</p><div class="options-grid">' +
      Object.keys(VOCAB).map(k => `<button type="button" class="opt-btn" data-k="${k}">${LABELS[k] || k}</button>`).join('') + '</div>';
    scr.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => start({ pool: VOCAB[b.dataset.k] }); });
    scr.querySelector('h2')?.focus();
  }

  /* En el mapa: nodo de repaso al final de cada unidad (se abre al completar sus 3 lecciones) */
  const poolOf = unit => {
    const seen = new Set(), out = [];
    unit.lessons.forEach(l => { if (!seen.has(l.category)) { seen.add(l.category); out.push(...VOCAB[l.category]); } });
    return out;
  };
  function addCardNodes() {
    document.querySelectorAll('#map-container .unit-container').forEach((uc, i) => {
      const unit = DB.units[i], row = uc.querySelector('.lessons-row');
      if (!unit || !row || row.querySelector('.card-node')) return;
      const unlocked = unit.lessons.every(l => state.completed.includes(l.id));
      const done = getDone().includes(unit.id);
      const n = document.createElement('button');
      n.type = 'button';
      n.className = 'lesson-node card-node ' + (!unlocked ? 'locked' : done ? 'card-done' : 'ready');
      n.innerHTML = unlocked ? '<span class="icon" aria-hidden="true">🃏</span><span class="lvl">Repaso</span>' : '<span class="icon" aria-hidden="true">🔒</span>';
      n.setAttribute('aria-label', `${done ? 'Repaso completado' : 'Repasar'}: ${unit.title}`);
      n.disabled = !unlocked;
      if (unlocked) n.onclick = () => start({ pool: poolOf(unit), unitId: unit.id });
      row.appendChild(n);
    });
  }
  new MutationObserver(addCardNodes).observe(document.getElementById('map-container'), { childList: true });
  addCardNodes();

  function start(src) {
    deck = getRandom(src.pool, 8).map(i => ({ es: i.es, de: i.de, emoji: i.emoji || '' }));
    showScreen('screen-cards');
    render(src);
  }

  function render(src) {
    if (!deck.length) return finish(src);
    const t = deck[0];
    checked = false;
    scr.innerHTML = `<div role="status" aria-live="polite" style="text-align:center;color:var(--text-dim);margin-bottom:10px">Tarjetas restantes: ${deck.length}</div>
<div class="fc-deck">${deck.length > 2 ? '<div class="fc-card fc-l2"></div>' : ''}${deck.length > 1 ? '<div class="fc-card fc-l1"></div>' : ''}<div class="fc-card fc-top" id="fc-top"><span style="font-size:2.2rem">${esc(t.emoji)}</span><span>${esc(t.es)}</span></div></div>
<label class="sr-only" for="fc-in">Escribe la traducción en alemán</label>
<input id="fc-in" class="text-input-fallback" style="margin-bottom:10px" placeholder="En alemán..." autocomplete="off" autocapitalize="off" spellcheck="false">
<div class="feedback-msg" id="fc-fb" role="status" aria-live="polite"></div>
<button class="btn-main" id="fc-btn" type="button">COMPROBAR</button>
<button class="fc-mic" id="fc-mic" type="button">🎤 Decirlo en voz alta</button>`;
    const inp = document.getElementById('fc-in'), btn = document.getElementById('fc-btn'), fb = document.getElementById('fc-fb');
    btn.disabled = true;
    inp.oninput = () => {
      if (checked) return;
      const hasAnswer = Boolean(inp.value.trim());
      btn.disabled = !hasAnswer;
      btn.classList.toggle('active', hasAnswer);
    };
    inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) btn.onclick(); };
    btn.onclick = () => {
      if (checked) { const d = deck.shift(); if (!lastOk) deck.push(d); render(src); return; }
      const v = inp.value.trim();
      if (!v) return;
      const a = norm(v), c = norm(t.de);
      lastOk = a === c || a === c.replace(/^(der|die|das) /, '');
      checked = true;
      inp.disabled = true;
      document.getElementById('fc-mic').disabled = true;
      btn.disabled = false;
      document.getElementById('fc-top').classList.add(lastOk ? 'fc-ok' : 'fc-bad');
      fb.className = 'feedback-msg show ' + (lastOk ? 'correct' : 'wrong');
      fb.innerHTML = `<span>${lastOk ? '¡Excelente!' : 'Incorrecto'}</span><span style="font-size:.8rem;opacity:.8">${esc(t.de)}</span>`;
      playSound(lastOk ? 'correct' : 'wrong');
      if (lastOk) speak(t.de);
      btn.textContent = 'CONTINUAR';
      btn.className = 'btn-main ' + (lastOk ? 'continue' : 'retry');
    };
    document.getElementById('fc-mic').onclick = () => {
      const R = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!R) { alert('Tu navegador no soporta reconocimiento de voz.'); return; }
      const r = new R(); r.lang = 'de-DE';
      r.onresult = e => { if (checked) return; inp.value = e.results[0][0].transcript; inp.oninput(); };
      try { r.start(); } catch (e) {}
    };
    inp.focus();
  }

  function finish(src) {
    const firstCompletion = Boolean(src.unitId && !getDone().includes(src.unitId));
    const gems = firstCompletion ? 15 : 0;
    if (firstCompletion) {
      markDone(src.unitId);
      state.gems += gems;
      save();
      updateUI();
    }
    playSound('win');
    scr.innerHTML = `<div style="text-align:center;font-size:4rem;margin-top:30px" aria-hidden="true">🎉</div>
<h2 tabindex="-1" style="text-align:center;margin:10px 0">¡Tarjetas completadas!</h2>
<p style="text-align:center;color:var(--text-dim);margin-bottom:20px">${gems > 0 ? `+${gems} gemas por tu primer repaso` : '¡Vocabulario reforzado!'}</p>
<button class="btn-main active" id="fc-again" type="button">OTRO MAZO</button>
<button class="btn-main active" style="margin-top:10px" id="fc-map" type="button">VOLVER AL MAPA</button>`;
    scr.querySelector('h2')?.focus();
    document.getElementById('fc-again').onclick = () => start(src);
    document.getElementById('fc-map').onclick = () => showScreen('screen-map');
  }

  /* Botón 🃏 en la cabecera: modo aparte */
  const cardsButton = document.createElement('button');
  cardsButton.type = 'button';
  cardsButton.className = 'stat-box';
  cardsButton.id = 'open-cards';
  cardsButton.setAttribute('aria-label', 'Abrir tarjetas de repaso');
  cardsButton.title = 'Tarjetas de repaso';
  cardsButton.textContent = '🃏';
  cardsButton.onclick = picker;
  document.querySelector('.stats').insertBefore(cardsButton, document.querySelector('.stats').firstChild);
})();
