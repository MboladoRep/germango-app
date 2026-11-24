/* Germango extras: (1) scroll a la lección actual, (2) botón "Siguiente lección",
   (3) modo Tarjetas ES -> DE (botón 🃏 en la cabecera). No modifica el resto del código. */
(function () {
  const st = document.createElement('style');
  st.textContent = `
input{user-select:text;-webkit-user-select:text}
.fc-deck{position:relative;width:100%;height:150px;margin:10px 0 18px}
.fc-card{position:absolute;inset:0;background:var(--card-dark);border:2px solid var(--border-color);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:transform .35s,opacity .35s}
.fc-l1{transform:translateY(8px) scale(.96);opacity:.7}
.fc-l2{transform:translateY(16px) scale(.92);opacity:.4}
.fc-top{z-index:3;font-size:1.6rem;font-weight:700}
.fc-ok{transform:translateX(120%) rotate(15deg);opacity:0;border-color:var(--primary-green)}
.fc-bad{animation:shake .3s;border-color:var(--error-red)}`;
  document.head.appendChild(st);

  /* 1) Al volver al mapa, centrar la lección actual */
  const goCurrent = () => requestAnimationFrame(() => {
    const n = document.querySelector('.lesson-node.current');
    if (n) n.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
  nextBtn.className = 'btn-main active';
  nextBtn.style.marginBottom = '10px';
  nextBtn.textContent = 'SIGUIENTE LECCIÓN';
  nextBtn.onclick = () => {
    const n = document.querySelector('.lesson-node.current');
    if (n && state.hearts > 0) n.click(); else exitToMap();
  };
  res.insertBefore(nextBtn, old);

  /* 3) Modo Tarjetas */
  const LABELS = { greetings: 'Saludos', family: 'Familia', food: 'Comida', animals: 'Animales', numbers: 'Números', time: 'Tiempo', colors: 'Colores', verbs: 'Verbos', body: 'Cuerpo', house: 'Casa', weather: 'Clima', transport: 'Transporte', professions: 'Profesiones' };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => s.toLowerCase().replace(/[.,!?¿¡]/g, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();

  const scr = document.createElement('div');
  scr.id = 'screen-cards';
  scr.className = 'screen';
  document.getElementById('app').appendChild(scr);

  let deck = [], checked = false, lastOk = false;

  function picker() {
    showScreen('screen-cards');
    scr.innerHTML = '<h2 style="text-align:center;margin-bottom:6px">🃏 Tarjetas</h2><p style="text-align:center;color:var(--text-dim);margin-bottom:15px">Elige un tema</p><div class="options-grid">' +
      Object.keys(VOCAB).map(k => `<button class="opt-btn" data-k="${k}">${LABELS[k] || k}</button>`).join('') + '</div>';
    scr.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => start(b.dataset.k); });
  }

  function start(k) {
    deck = [...VOCAB[k]].sort(() => Math.random() - 0.5).slice(0, 8).map(i => ({ es: i.es, de: i.de, emoji: i.emoji || '' }));
    render(k);
  }

  function render(k) {
    if (!deck.length) return finish(k);
    const t = deck[0];
    checked = false;
    scr.innerHTML = `<div style="text-align:center;color:var(--text-dim);margin-bottom:10px">Tarjetas restantes: ${deck.length}</div>
<div class="fc-deck">${deck.length > 2 ? '<div class="fc-card fc-l2"></div>' : ''}${deck.length > 1 ? '<div class="fc-card fc-l1"></div>' : ''}<div class="fc-card fc-top" id="fc-top"><span style="font-size:2.2rem">${esc(t.emoji)}</span><span>${esc(t.es)}</span></div></div>
<input id="fc-in" class="text-input-fallback" style="margin-bottom:10px" placeholder="En alemán..." autocomplete="off" autocapitalize="off" spellcheck="false">
<div class="feedback-msg" id="fc-fb"></div>
<button class="btn-main" id="fc-btn">COMPROBAR</button>
<button class="write-mode-btn" id="fc-mic">🎤 Decirlo en voz alta</button>`;
    const inp = document.getElementById('fc-in'), btn = document.getElementById('fc-btn'), fb = document.getElementById('fc-fb');
    inp.oninput = () => { if (!checked) btn.classList.toggle('active', !!inp.value.trim()); };
    inp.onkeydown = e => { if (e.key === 'Enter') btn.onclick(); };
    btn.onclick = () => {
      if (checked) { const d = deck.shift(); if (!lastOk) deck.push(d); render(k); return; }
      const v = inp.value.trim();
      if (!v) return;
      const a = norm(v), c = norm(t.de);
      lastOk = a === c || a === c.replace(/^(der|die|das) /, '');
      checked = true;
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
      r.onresult = e => { inp.value = e.results[0][0].transcript; inp.oninput(); };
      try { r.start(); } catch (e) {}
    };
    inp.focus();
  }

  function finish(k) {
    state.gems += 5; save(); updateUI(); playSound('win');
    scr.innerHTML = `<div style="text-align:center;font-size:4rem;margin-top:30px">🎉</div>
<h2 style="text-align:center;margin:10px 0">¡Tarjetas completadas!</h2>
<p style="text-align:center;color:var(--text-dim);margin-bottom:20px">+5 💎</p>
<button class="btn-main active" id="fc-again">OTRO MAZO</button>
<button class="btn-main active" style="margin-top:10px" id="fc-map">VOLVER AL MAPA</button>`;
    document.getElementById('fc-again').onclick = () => start(k);
    document.getElementById('fc-map').onclick = () => showScreen('screen-map');
  }

  document.querySelector('.stats').insertAdjacentHTML('afterbegin', '<div class="stat-box" id="open-cards" title="Tarjetas">🃏</div>');
  document.getElementById('open-cards').onclick = picker;
})();
