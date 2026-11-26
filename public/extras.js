/* Germango 9.6: repaso por tarjetas, traductor y frases personales para practicar. */
(function () {
  /* 1) Al volver al mapa, centrar la lección actual */
  const goCurrent = () => requestAnimationFrame(() => {
    const node = document.querySelector('.lesson-node.current');
    if (node) node.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  const mapEl = document.getElementById('screen-map');
  new MutationObserver(() => { if (mapEl.classList.contains('active')) goCurrent(); })
    .observe(mapEl, { attributes: true, attributeFilter: ['class'] });
  goCurrent();

  /* 2) Botón "Siguiente lección" en la pantalla de resultado */
  const resultScreen = document.getElementById('screen-result');
  const oldResultButton = resultScreen.querySelector('button');
  oldResultButton.textContent = 'VOLVER AL MAPA';
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'btn-main active';
  nextButton.style.marginBottom = '10px';
  nextButton.textContent = 'SIGUIENTE LECCIÓN';
  nextButton.onclick = () => {
    const currentLesson = document.querySelector('.lesson-node.current');
    if (currentLesson && state.hearts > 0) currentLesson.click(); else exitToMap();
  };
  resultScreen.insertBefore(nextButton, oldResultButton);

  /* 3) Repaso y traductor */
  const LABELS = { greetings: 'Saludos', family: 'Familia', food: 'Comida', animals: 'Animales', numbers: 'Números', time: 'Tiempo', colors: 'Colores', verbs: 'Verbos', body: 'Cuerpo', house: 'Casa', weather: 'Clima', transport: 'Transporte', professions: 'Profesiones' };
  const esc = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const norm = value => value.toLowerCase().replace(/[.,!?¿¡]/g, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();
  const DONE_KEY = 'germango_cards_done';
  const getDone = () => { try { const value = JSON.parse(localStorage.getItem(DONE_KEY)); return Array.isArray(value) ? value : []; } catch { return []; } };
  const markDone = id => { try { const done = getDone(); if (!done.includes(id)) { done.push(id); localStorage.setItem(DONE_KEY, JSON.stringify(done)); } } catch {} };

  const cardsScreen = document.createElement('section');
  cardsScreen.id = 'screen-cards';
  cardsScreen.className = 'screen';
  document.getElementById('app').appendChild(cardsScreen);

  const translatorScreen = document.createElement('section');
  translatorScreen.id = 'screen-translator';
  translatorScreen.className = 'screen screen-translator';
  translatorScreen.innerHTML = `<div class="translator-shell">
    <header class="translator-heading">
      <div><div class="translator-kicker">GERMANGO 9.6 · TRADUCTOR</div><h2 id="translator-title" tabindex="-1">Español a alemán</h2><p>Traduce una frase y guárdala para repasarla cuando quieras.</p><p class="translator-note">Las frases se procesan mediante MyMemory; el servicio gratuito tiene un límite diario (actualmente 5.000 caracteres). Evita incluir datos personales.</p></div>
      <button class="translator-back" id="translator-back" type="button">Volver al mapa</button>
    </header>
    <section class="translator-panel" aria-label="Traducir una frase">
      <form class="translator-form" id="translation-form">
        <label for="translator-input">Frase en español</label>
        <textarea class="translator-textarea" id="translator-input" maxlength="200" placeholder="Escribe aquí la frase que quieres decir en alemán…" required></textarea>
        <div class="translator-form-footer"><span class="translator-hint">Hasta 200 caracteres · máximo 500 bytes por consulta</span><button class="translator-primary" id="translate-button" type="submit">Traducir al alemán</button></div>
      </form>
      <p class="translator-status" id="translation-status" role="status" aria-live="polite"></p>
    </section>
    <section class="translation-result" id="translation-result" aria-labelledby="translation-result-title" hidden>
      <h3 id="translation-result-title">Tu traducción</h3>
      <p class="translation-german" id="translation-german" lang="de"></p>
      <div class="translation-actions"><button class="translator-secondary" id="play-translation" type="button">Escuchar alemán</button><button class="translator-primary" id="save-translation" type="button" hidden>Guardar y practicar</button></div>
    </section>
    <section class="phrase-library" aria-labelledby="phrase-library-title">
      <div class="phrase-library-header"><div><h3 id="phrase-library-title">Mis frases guardadas</h3><p>Estas frases aparecerán en tu mazo personal de tarjetas.</p></div><button class="translator-secondary" id="practice-saved-phrases" type="button" disabled>Practicar mis frases</button></div>
      <p class="phrase-count" id="phrase-count" aria-live="polite"></p>
      <p class="phrase-status" id="phrase-status" role="status" aria-live="polite"></p>
      <ul class="phrase-list" id="phrase-list"></ul>
    </section>
  </div>`;
  document.getElementById('app').appendChild(translatorScreen);

  const translationInput = translatorScreen.querySelector('#translator-input');
  const translationForm = translatorScreen.querySelector('#translation-form');
  const translateButton = translatorScreen.querySelector('#translate-button');
  const translationStatus = translatorScreen.querySelector('#translation-status');
  const translationResult = translatorScreen.querySelector('#translation-result');
  const germanResult = translatorScreen.querySelector('#translation-german');
  const saveTranslationButton = translatorScreen.querySelector('#save-translation');
  const phraseCount = translatorScreen.querySelector('#phrase-count');
  const phraseStatus = translatorScreen.querySelector('#phrase-status');
  const phraseList = translatorScreen.querySelector('#phrase-list');
  const practicePhrasesButton = translatorScreen.querySelector('#practice-saved-phrases');

  let deck = [];
  let checked = false;
  let lastOk = false;
  let savedPhrases = [];
  let currentSpanish = '';
  let currentGerman = '';
  let savingTranslation = false;
  let activeRecognition = null;

  function currentTranslationIsSaved() {
    const spanish = currentSpanish.trim().toLocaleLowerCase();
    const german = currentGerman.trim().toLocaleLowerCase();
    return Boolean(spanish && german && savedPhrases.some(phrase => phrase.spanish.trim().toLocaleLowerCase() === spanish && phrase.german.trim().toLocaleLowerCase() === german));
  }

  function updateSaveButton() {
    if (!saveTranslationButton) return;
    const isSaved = currentTranslationIsSaved();
    saveTranslationButton.textContent = isSaved ? 'Ya está en Mis frases' : savingTranslation ? 'Guardando…' : 'Guardar y practicar';
    saveTranslationButton.disabled = isSaved || savingTranslation || !currentGerman;
  }

  function renderSavedPhrases() {
    phraseCount.textContent = `${savedPhrases.length} ${savedPhrases.length === 1 ? 'frase guardada' : 'frases guardadas'}`;
    practicePhrasesButton.disabled = savedPhrases.length === 0;
    phraseList.replaceChildren();

    if (!savedPhrases.length) {
      const empty = document.createElement('li');
      empty.className = 'phrase-empty';
      empty.textContent = 'Aún no has guardado frases. Traduce una frase y pulsa «Guardar y practicar» para crear tu mazo.';
      phraseList.appendChild(empty);
      updateSaveButton();
      return;
    }

    savedPhrases.forEach(phrase => {
      const item = document.createElement('li');
      item.className = 'saved-phrase-item';
      const copy = document.createElement('div');
      copy.className = 'phrase-copy';
      const spanish = document.createElement('strong');
      spanish.lang = 'es';
      spanish.textContent = phrase.spanish;
      const german = document.createElement('span');
      german.lang = 'de';
      german.textContent = phrase.german;
      copy.append(spanish, german);

      const actions = document.createElement('div');
      actions.className = 'phrase-actions';
      const listen = document.createElement('button');
      listen.type = 'button';
      listen.className = 'translator-utility-button';
      listen.textContent = 'Escuchar';
      listen.setAttribute('aria-label', `Escuchar en alemán: ${phrase.german}`);
      listen.onclick = () => speak(phrase.german);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'translator-utility-button';
      remove.textContent = 'Eliminar';
      remove.setAttribute('aria-label', `Eliminar la frase: ${phrase.spanish}`);
      remove.onclick = async () => {
        remove.disabled = true;
        phraseStatus.classList.remove('is-error');
        phraseStatus.textContent = 'Eliminando frase…';
        try {
          const response = await fetch(`/api/translator?id=${encodeURIComponent(phrase.id)}`, { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'No se pudo eliminar la frase.');
          savedPhrases = savedPhrases.filter(itemToKeep => itemToKeep.id !== phrase.id);
          phraseStatus.textContent = 'Frase eliminada.';
          renderSavedPhrases();
        } catch (error) {
          remove.disabled = false;
          phraseStatus.classList.add('is-error');
          phraseStatus.textContent = error instanceof Error ? error.message : 'No se pudo eliminar la frase.';
        }
      };
      actions.append(listen, remove);
      item.append(copy, actions);
      phraseList.appendChild(item);
    });
    updateSaveButton();
  }

  async function loadSavedPhrases() {
    try {
      const response = await fetch('/api/translator', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las frases.');
      savedPhrases = Array.isArray(data.phrases) ? data.phrases : [];
      phraseStatus.classList.remove('is-error');
      phraseStatus.textContent = '';
      renderSavedPhrases();
      return true;
    } catch (error) {
      phraseStatus.classList.add('is-error');
      phraseStatus.textContent = error instanceof Error ? error.message : 'No se pudieron cargar las frases.';
      renderSavedPhrases();
      return false;
    }
  }

  function openTranslator() {
    showScreen('screen-translator');
    translatorScreen.querySelector('#translator-title').focus();
    void loadSavedPhrases();
  }

  translatorScreen.querySelector('#translator-back').onclick = () => {
    showScreen('screen-map');
    document.getElementById('open-translator')?.focus();
  };
  translationInput.addEventListener('input', () => {
    currentSpanish = '';
    currentGerman = '';
    translationResult.hidden = true;
    translationStatus.textContent = '';
    translationStatus.classList.remove('is-error');
    updateSaveButton();
  });
  translationForm.addEventListener('submit', async event => {
    event.preventDefault();
    const spanish = translationInput.value.trim();
    if (!spanish) return;

    translateButton.disabled = true;
    translationInput.disabled = true;
    translateButton.textContent = 'Traduciendo…';
    translationStatus.classList.remove('is-error');
    translationStatus.textContent = 'Buscando una traducción natural…';
    translationResult.hidden = true;
    currentSpanish = '';
    currentGerman = '';

    try {
      const response = await fetch('/api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate', text: spanish }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.translation !== 'string') throw new Error(data.error || 'No se pudo traducir la frase.');

      currentSpanish = spanish;
      currentGerman = data.translation;
      germanResult.textContent = currentGerman;
      translationResult.hidden = false;
      saveTranslationButton.hidden = false;
      translationStatus.textContent = 'Traducción lista. Puedes escucharla o guardarla para practicar.';
      updateSaveButton();
    } catch (error) {
      translationStatus.classList.add('is-error');
      translationStatus.textContent = error instanceof Error ? error.message : 'No se pudo traducir la frase. Inténtalo de nuevo.';
    } finally {
      translationInput.disabled = false;
      translateButton.disabled = false;
      translateButton.textContent = 'Traducir al alemán';
    }
  });
  translatorScreen.querySelector('#play-translation').onclick = () => {
    if (currentGerman) speak(currentGerman);
  };
  saveTranslationButton.onclick = async () => {
    if (!currentSpanish || !currentGerman || savingTranslation) return;
    savingTranslation = true;
    phraseStatus.classList.remove('is-error');
    phraseStatus.textContent = 'Guardando frase…';
    updateSaveButton();
    try {
      const response = await fetch('/api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', spanish: currentSpanish, german: currentGerman }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la frase.');
      await loadSavedPhrases();
      phraseStatus.textContent = data.alreadySaved ? 'Esa frase ya estaba en tu mazo.' : 'Frase guardada: ya está disponible en «Mis frases».';
    } catch (error) {
      phraseStatus.classList.add('is-error');
      phraseStatus.textContent = error instanceof Error ? error.message : 'No se pudo guardar la frase.';
    } finally {
      savingTranslation = false;
      updateSaveButton();
    }
  };
  practicePhrasesButton.onclick = () => {
    if (savedPhrases.length) start({ pool: savedPhrases.map(phrase => ({ es: phrase.spanish, de: phrase.german })) });
  };

  function renderCardTopics() {
    const topics = cardsScreen.querySelector('#card-topics');
    if (!topics) return;
    const keys = Object.keys(VOCAB);
    const builtInTopics = keys.map(key => `<button type="button" class="opt-btn" data-k="${key}">${LABELS[key] || key}</button>`).join('');
    const savedTopic = savedPhrases.length ? `<button type="button" class="opt-btn" data-k="saved">Mis frases (${savedPhrases.length})</button>` : '';
    topics.innerHTML = builtInTopics + savedTopic;
    topics.querySelectorAll('[data-k]').forEach(button => {
      button.onclick = () => {
        if (button.dataset.k === 'saved') {
          if (savedPhrases.length) start({ pool: savedPhrases.map(phrase => ({ es: phrase.spanish, de: phrase.german })) });
          return;
        }
        start({ pool: VOCAB[button.dataset.k] });
      };
    });
  }

  function picker() {
    showScreen('screen-cards');
    cardsScreen.innerHTML = `<h2 tabindex="-1" style="text-align:center;margin-bottom:6px">Tarjetas de alemán</h2><p style="text-align:center;color:var(--text-dim);margin-bottom:15px">Elige un tema para practicar</p><div class="options-grid" id="card-topics"></div><div class="cards-picker-actions"><button class="translator-secondary" id="cards-to-map" type="button">Volver al mapa</button><button class="translator-secondary" id="cards-to-translator" type="button">Abrir traductor</button></div>`;
    renderCardTopics();
    cardsScreen.querySelector('h2')?.focus();
    cardsScreen.querySelector('#cards-to-map').onclick = () => showScreen('screen-map');
    cardsScreen.querySelector('#cards-to-translator').onclick = openTranslator;
    void loadSavedPhrases().then(renderCardTopics);
  }

  const poolOf = unit => {
    const seen = new Set();
    const pool = [];
    unit.lessons.forEach(lesson => {
      if (!seen.has(lesson.category)) {
        seen.add(lesson.category);
        pool.push(...VOCAB[lesson.category]);
      }
    });
    return pool;
  };

  function addCardNodes() {
    document.querySelectorAll('#map-container .unit-container').forEach((unitContainer, index) => {
      const unit = DB.units[index];
      const row = unitContainer.querySelector('.lessons-row');
      if (!unit || !row || row.querySelector('.card-node')) return;
      const unlocked = unit.lessons.every(lesson => state.completed.includes(lesson.id));
      const done = getDone().includes(unit.id);
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'lesson-node card-node ' + (!unlocked ? 'locked' : done ? 'card-done' : 'ready');
      node.innerHTML = unlocked ? '<span class="icon" aria-hidden="true">🃏</span><span class="lvl">Repaso</span>' : '<span class="icon" aria-hidden="true">🔒</span>';
      node.setAttribute('aria-label', `${done ? 'Repaso completado' : 'Repasar'}: ${unit.title}`);
      node.disabled = !unlocked;
      if (unlocked) node.onclick = () => start({ pool: poolOf(unit), unitId: unit.id });
      row.appendChild(node);
    });
  }

  new MutationObserver(addCardNodes).observe(document.getElementById('map-container'), { childList: true });
  addCardNodes();

  function stopActiveRecognition() {
    if (!activeRecognition) return;
    const recognition = activeRecognition;
    activeRecognition = null;
    try { recognition.abort(); } catch {}
  }

  function start(source) {
    stopActiveRecognition();
    deck = getRandom(source.pool, Math.min(8, source.pool.length)).map(item => ({ es: item.es, de: item.de, emoji: item.emoji || '' }));
    showScreen('screen-cards');
    render(source);
  }

  function render(source) {
    stopActiveRecognition();
    if (!deck.length) return finish(source);
    const card = deck[0];
    checked = false;
    cardsScreen.innerHTML = `<div role="status" aria-live="polite" style="text-align:center;color:var(--text-dim);margin-bottom:10px">Tarjetas restantes: ${deck.length}</div>
<div class="fc-deck">${deck.length > 2 ? '<div class="fc-card fc-l2"></div>' : ''}${deck.length > 1 ? '<div class="fc-card fc-l1"></div>' : ''}<div class="fc-card fc-top" id="fc-top"><span style="font-size:2.2rem">${esc(card.emoji)}</span><span>${esc(card.es)}</span></div></div>
<label class="sr-only" for="fc-in">Escribe la traducción en alemán</label>
<input id="fc-in" class="text-input-fallback" style="margin-bottom:10px" placeholder="En alemán…" autocomplete="off" autocapitalize="off" spellcheck="false">
<div class="feedback-msg" id="fc-fb" role="status" aria-live="polite"></div>
<button class="btn-main" id="fc-btn" type="button">COMPROBAR</button>
<button class="fc-mic" id="fc-mic" type="button" aria-label="Decir la respuesta en alemán" aria-pressed="false">Decirlo en voz alta</button>
<p class="fc-mic-feedback" id="fc-mic-feedback" role="status" aria-live="polite"></p>`;
    const input = document.getElementById('fc-in');
    const checkButton = document.getElementById('fc-btn');
    const feedback = document.getElementById('fc-fb');
    const micButton = document.getElementById('fc-mic');
    const micFeedback = document.getElementById('fc-mic-feedback');
    checkButton.disabled = true;
    input.oninput = () => {
      if (checked) return;
      const hasAnswer = Boolean(input.value.trim());
      checkButton.disabled = !hasAnswer;
      checkButton.classList.toggle('active', hasAnswer);
    };
    input.onkeydown = event => {
      if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) checkButton.onclick();
    };
    checkButton.onclick = () => {
      if (checked) {
        const item = deck.shift();
        if (!lastOk) deck.push(item);
        render(source);
        return;
      }
      const answer = input.value.trim();
      if (!answer) return;
      const normalizedAnswer = norm(answer);
      const normalizedGerman = norm(card.de);
      lastOk = normalizedAnswer === normalizedGerman || normalizedAnswer === normalizedGerman.replace(/^(der|die|das) /, '');
      checked = true;
      stopActiveRecognition();
      input.disabled = true;
      micButton.disabled = true;
      checkButton.disabled = false;
      document.getElementById('fc-top').classList.add(lastOk ? 'fc-ok' : 'fc-bad');
      feedback.className = 'feedback-msg show ' + (lastOk ? 'correct' : 'wrong');
      feedback.innerHTML = `<span>${lastOk ? '¡Excelente!' : 'Incorrecto'}</span><span style="font-size:.8rem;opacity:.8">${esc(card.de)}</span>`;
      micFeedback.textContent = '';
      playSound(lastOk ? 'correct' : 'wrong');
      if (lastOk) speak(card.de);
      checkButton.textContent = 'CONTINUAR';
      checkButton.className = 'btn-main ' + (lastOk ? 'continue' : 'retry');
    };
    micButton.onclick = () => {
      if (activeRecognition) {
        const recognition = activeRecognition;
        activeRecognition = null;
        micButton.classList.remove('listening');
        micButton.setAttribute('aria-pressed', 'false');
        micButton.textContent = 'Decirlo en voz alta';
        micFeedback.textContent = 'Escucha detenida. Puedes revisar el texto.';
        try { recognition.stop(); } catch {}
        return;
      }

      const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!Recognition) {
        micFeedback.textContent = 'Este navegador no permite reconocimiento de voz. Escribe la respuesta en el campo.';
        return;
      }

      const recognition = new Recognition();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      activeRecognition = recognition;

      const resetMic = () => {
        if (document.getElementById('fc-mic') !== micButton || (activeRecognition && activeRecognition !== recognition)) return;
        if (activeRecognition === recognition) activeRecognition = null;
        micButton.classList.remove('listening');
        micButton.setAttribute('aria-pressed', 'false');
        micButton.textContent = 'Decirlo en voz alta';
      };

      recognition.onstart = () => {
        if (activeRecognition !== recognition) return;
        micButton.classList.add('listening');
        micButton.setAttribute('aria-pressed', 'true');
        micButton.textContent = 'Detener escucha';
        micFeedback.textContent = 'Te escucho. Di la frase en alemán.';
      };
      recognition.onresult = event => {
        if (checked || document.getElementById('fc-in') !== input) return;
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (!transcript) {
          micFeedback.textContent = 'No se reconoció ninguna frase. Vuelve a intentarlo o escribe la respuesta.';
          return;
        }
        input.value = transcript;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        micFeedback.textContent = `Reconocido: ${transcript}`;
      };
      recognition.onerror = event => {
        if (activeRecognition !== recognition) return;
        activeRecognition = null;
        resetMic();
        const messages = {
          'not-allowed': 'Permite el acceso al micrófono en el navegador y vuelve a intentarlo.',
          'service-not-allowed': 'El navegador ha bloqueado el reconocimiento de voz. Escribe la respuesta en el campo.',
          'no-speech': 'No se detectó voz. Comprueba el micrófono e inténtalo otra vez.',
          'audio-capture': 'No se encontró un micrófono disponible.',
          network: 'Falló la conexión del reconocimiento de voz. Inténtalo de nuevo.',
        };
        micFeedback.textContent = messages[event.error] || 'No se pudo iniciar el reconocimiento. Puedes escribir la respuesta en el campo.';
      };
      recognition.onend = resetMic;

      micButton.classList.add('listening');
      micButton.setAttribute('aria-pressed', 'true');
      micButton.textContent = 'Escuchando…';
      micFeedback.textContent = 'Preparando el micrófono…';
      try {
        recognition.start();
      } catch {
        activeRecognition = null;
        resetMic();
        micFeedback.textContent = 'No se pudo iniciar el micrófono. Comprueba los permisos y vuelve a intentarlo.';
      }
    };
    input.focus();
  }

  function finish(source) {
    stopActiveRecognition();
    const firstCompletion = Boolean(source.unitId && !getDone().includes(source.unitId));
    const gems = firstCompletion ? 15 : 0;
    if (firstCompletion) {
      markDone(source.unitId);
      state.gems += gems;
      save();
      updateUI();
    }
    playSound('win');
    cardsScreen.innerHTML = `<div style="text-align:center;font-size:4rem;margin-top:30px" aria-hidden="true">🎉</div>
<h2 tabindex="-1" style="text-align:center;margin:10px 0">¡Tarjetas completadas!</h2>
<p style="text-align:center;color:var(--text-dim);margin-bottom:20px">${gems > 0 ? `+${gems} gemas por tu primer repaso` : '¡Vocabulario reforzado!'}</p>
<button class="btn-main active" id="fc-again" type="button">OTRO MAZO</button>
<button class="btn-main active" style="margin-top:10px" id="fc-map" type="button">VOLVER AL MAPA</button>`;
    cardsScreen.querySelector('h2')?.focus();
    document.getElementById('fc-again').onclick = () => start(source);
    document.getElementById('fc-map').onclick = () => showScreen('screen-map');
  }

  const cardsButton = document.createElement('button');
  cardsButton.type = 'button';
  cardsButton.className = 'stat-box';
  cardsButton.id = 'open-cards';
  cardsButton.setAttribute('aria-label', 'Abrir tarjetas de repaso');
  cardsButton.title = 'Tarjetas de repaso';
  cardsButton.textContent = '🃏';
  cardsButton.onclick = picker;

  const translatorButton = document.createElement('button');
  translatorButton.type = 'button';
  translatorButton.className = 'stat-box translator-nav';
  translatorButton.id = 'open-translator';
  translatorButton.setAttribute('aria-label', 'Abrir traductor español-alemán');
  translatorButton.title = 'Traductor español-alemán';
  translatorButton.textContent = 'ES↔DE';
  translatorButton.onclick = openTranslator;

  const stats = document.querySelector('.stats');
  stats.insertBefore(cardsButton, stats.firstChild);
  stats.insertBefore(translatorButton, cardsButton.nextSibling);
  void loadSavedPhrases();
})();
