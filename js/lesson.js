// ===== LECCIONES: flujo, render de preguntas, entradas (choice/wordbank/match) y comprobación =====
const startLesson = (les) => {
  if (state.hearts <= 0) {
    currentLessonData = les;
    openGameOver();
    return;
  }
  const qTypes = ['choice', 'wordbank', 'match', 'audio', 'speak'];
  const category = les.category || 'greetings';
  const generatedQuestions = qTypes.map(qType => generateQuestion(qType, category)).filter(q => q);
  currentLessonData = { ...les, questions: generatedQuestions };
  state.currentQ = 0; state.checking = false; state.selected = null; state.answers = [];
  matchState = { first: null, second: null, lock: false, solved: [] };
  DOM.overlayGameover.classList.remove('active');
  showScreen('screen-lesson');
  renderProgress();
  renderQ();
  DOM.lessonContent.querySelector('button, input')?.focus();
};

const renderProgress = () => {
  DOM.progressBar.innerHTML = '';
  const questionCount = currentLessonData.questions.length;
  DOM.progressBar.setAttribute('aria-valuenow', String(Math.round((state.currentQ / questionCount) * 100)));
  currentLessonData.questions.forEach((_, i) => {
    const seg = document.createElement('div');
    seg.className = 'progress-segment';
    if (i < state.currentQ) seg.classList.add('done');
    else if (i === state.currentQ) seg.classList.add('current');
    DOM.progressBar.appendChild(seg);
  });
};

const renderQ = () => {
  const q = currentLessonData.questions[state.currentQ];
  if (!q) return finishLesson();

  DOM.feedbackMsg.className = 'feedback-msg';
  DOM.btnAction.disabled = true;
  DOM.btnAction.className = 'btn-main'; DOM.btnAction.innerText = 'COMPROBAR';
  DOM.btnAction.classList.remove('active');

  const c = DOM.lessonContent;
  let html = `<h2 class="prompt-text">${q.prompt}</h2>`;
  const emojiHtml = q.emoji ? `<span class="emoji">${q.emoji}</span>` : '';

  if (q.type === 'choice' || q.type === 'audio') {
    if (q.type === 'audio') {
      html += `<button type="button" class="audio-prompt-btn" aria-label="Escuchar la palabra en alemán" onclick="speak('${q.audioText || q.text}')">🔊</button>`;
      setTimeout(() => speak(q.audioText || q.text), 300);
    } else {
      html += `<div class="main-text">${emojiHtml} ${q.text}</div>`;
    }
    html += `<div class="options-grid">`;
    q.options.forEach((o) => {
      html += `<button type="button" class="opt-btn" aria-pressed="false" onclick="selectChoice(this, '${o.replace(/'/g, "\\'")}')">${o}</button>`;
    });
    html += `</div>`;
  }
  else if (q.type === 'speak') {
    html += `<div class="main-text">${emojiHtml} ${q.text}</div>
      <div class="speak-container" id="speak-ui">
        <button type="button" class="listen-again-btn" onclick="speak('${q.text}')"><span>🔊</span> Escuchar de nuevo</button>
        <button class="speak-btn" id="mic-btn" type="button" aria-pressed="false" onclick="triggerSpeech()">🎤 Toca para hablar</button>
        <div class="mic-feedback" id="mic-result" role="status" aria-live="polite"></div>
        <button type="button" class="no-mic-btn" onclick="switchToTyping()">⌨️ No puedo usar el micrófono</button>
      </div>`;
    setTimeout(() => speak(q.text), 300);
  }
  else if (q.type === 'wordbank') {
    html += `<div class="main-text">${emojiHtml} ${q.text}</div>
      <div class="sentence-area" id="sentence-area" role="group" aria-label="Tu respuesta"></div>
      <div class="bank" id="bank-area" role="group" aria-label="Palabras disponibles">`;
    q.words.forEach(w => { html += `<button type="button" class="token" data-w="${w}" aria-label="Añadir ${w}" onclick="addWord(this)">${w}</button>`; });
    html += `</div>`;
  }
  else if (q.type === 'match') {
    html += `<div class="match-grid" id="match-grid">`;
    const cards = [];
    q.pairs.forEach((p, i) => { cards.push({ id: i, val: p[0] }); cards.push({ id: i, val: p[1] }); });
    cards.splice(0, cards.length, ...getRandom(cards, cards.length));
      cards.forEach(card => {
      html += `<button type="button" class="match-card" data-id="${card.id}" aria-pressed="false" aria-label="Elegir ${card.val}" onclick="selectMatch(this, ${card.id})">${card.val}</button>`;
    });
    html += `</div>`;
  }
  c.innerHTML = html;
};

// --- Entradas ---
const selectChoice = (el, val) => {
  if (state.checking) return;
  document.querySelectorAll('.opt-btn').forEach(button => {
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
  });
  el.classList.add('selected');
  el.setAttribute('aria-pressed', 'true');
  state.selected = val;
  DOM.btnAction.disabled = false;
  DOM.btnAction.classList.add('active');
};

const addWord = (el) => {
  if (state.checking || el.classList.contains('placed')) return;
  el.classList.add('placed');
  el.disabled = true;
  state.answers.push(el.dataset.w);
  renderSentence();
};

const clearLastWord = () => {
  if (state.checking || state.answers.length === 0) return;
  const w = state.answers.pop();
  const btn = document.querySelector(`.token[data-w="${w}"].placed`);
  if (btn) { btn.classList.remove('placed'); btn.disabled = false; }
  renderSentence();
};

const removeSpecificWord = (index) => {
  const w = state.answers[index];
  const btn = document.querySelector(`.token[data-w="${w}"].placed`);
  if (btn) { btn.classList.remove('placed'); btn.disabled = false; }
  state.answers.splice(index, 1);
  renderSentence();
};

const renderSentence = () => {
  const area = document.getElementById('sentence-area');
  if (!area) return;
  area.innerHTML = '';
  state.answers.forEach((w, i) => {
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'token in-sentence';
    s.setAttribute('aria-label', `Quitar ${w}`);
    s.innerText = w;
    s.onclick = (e) => { e.stopPropagation(); removeSpecificWord(i); };
    area.appendChild(s);
  });
  DOM.btnAction.disabled = state.answers.length === 0;
  if (state.answers.length > 0) DOM.btnAction.classList.add('active');
  else DOM.btnAction.classList.remove('active');
};

const selectMatch = (el, id) => {
  if (matchState.lock || el.classList.contains('matched') || state.checking) return;
  el.classList.add('selected');
  el.setAttribute('aria-pressed', 'true');
  if (!matchState.first) {
    matchState.first = el;
  } else {
    matchState.second = el;
    if (matchState.first.dataset.id === matchState.second.dataset.id && matchState.first !== matchState.second) {
      matchState.first.classList.add('matched');
      matchState.second.classList.add('matched');
      matchState.first.disabled = true;
      matchState.second.disabled = true;
      matchState.solved.push(id);
      matchState.first = null; matchState.second = null; matchState.lock = false;
      const total = currentLessonData.questions[state.currentQ].pairs.length;
      if (matchState.solved.length === total) { state.selected = "MATCH_COMPLETE"; handleAction(); }
      else playSound('correct');
    } else {
      matchState.lock = true;
      playSound('wrong');
      setTimeout(() => {
        if (matchState.first)           matchState.first.classList.remove('selected');
        if (matchState.second) matchState.second.classList.remove('selected');
        if (matchState.first) matchState.first.setAttribute('aria-pressed', 'false');
        if (matchState.second) matchState.second.setAttribute('aria-pressed', 'false');
        matchState.first = null; matchState.second = null; matchState.lock = false;
      }, 600);
    }
  }
};

// --- Flujo: COMPROBAR / CONTINUAR ---
const handleAction = () => {
  const q = currentLessonData.questions[state.currentQ];
  const txt = document.getElementById('msg-text');
  const sub = document.getElementById('msg-sub');

  if (DOM.btnAction.innerText === 'COMPROBAR') {
    const hasAnswer = q.type === 'wordbank'
      ? state.answers.length > 0
      : Boolean(state.selected) || (q.type === 'match' && matchState.solved.length > 0);
    if (!hasAnswer) return;
    state.checking = true;
    DOM.btnAction.disabled = false;
    DOM.lessonContent.querySelectorAll('button').forEach(button => { button.disabled = true; });
    let isCorrect = false;

    if (q.type === 'choice' || q.type === 'audio') isCorrect = state.selected === q.correct;
    else if (q.type === 'match') isCorrect = matchState.solved.length === q.pairs.length;
    else if (q.type === 'wordbank') isCorrect = JSON.stringify(state.answers) === JSON.stringify(q.correct);
    else if (q.type === 'speak') isCorrect = isSpeechMatch(state.selected || '', q.text);

    if (isCorrect) {
      playSound('correct');
      txt.innerText = "¡Excelente!";
      let feedbackSub = "";
      if (q.type === 'speak' && q.meaning) feedbackSub = `${q.text} = ${q.meaning}`;
      else if (q.type === 'audio') feedbackSub = `${q.audioText} = ${q.correct}`;
      sub.innerText = feedbackSub;
      DOM.feedbackMsg.className = "feedback-msg show correct";
      DOM.btnAction.innerText = "CONTINUAR";
      DOM.btnAction.className = "btn-main continue";
    } else {
      playSound('wrong');
      txt.innerText = "Incorrecto";
      let cText = q.correct || q.text;
      if (q.type === 'wordbank') cText = q.correct.join(" ");
      if (q.type === 'audio') cText = q.correct;
      sub.innerText = `Correcto: ${cText}`;
      DOM.feedbackMsg.className = "feedback-msg show wrong";
      DOM.screenLesson.classList.add('shake');
      setTimeout(() => DOM.screenLesson.classList.remove('shake'), 300);
      state.hearts--; updateUI(); save();
      DOM.btnAction.innerText = "CONTINUAR";
      DOM.btnAction.className = "btn-main retry";

      if (q.type === 'choice' || q.type === 'audio') {
        document.querySelectorAll('.opt-btn').forEach(b => {
          if (b.innerText.includes(q.correct)) b.classList.add('correct');
          if (b.classList.contains('selected')) b.classList.add('wrong');
        });
      }
    }
  } else {
    if (state.hearts <= 0) { openGameOver(); return; }
    state.currentQ++;
    state.checking = false; state.selected = null; state.answers = [];
    matchState = { first: null, second: null, lock: false, solved: [] };
    if (state.currentQ >= currentLessonData.questions.length) finishLesson();
    else { renderProgress(); renderQ(); }
  }
};

const finishLesson = () => {
  DOM.progressBar.setAttribute('aria-valuenow', '100');
  playSound('win');
  const firstCompletion = !state.completed.includes(currentLessonData.id);
  if (firstCompletion) {
    state.completed.push(currentLessonData.id);
    state.gems += 20;
    state.streak++;
    save();
    updateUI();
  }
  document.getElementById('result-reward').textContent = firstCompletion ? '+20 gemas' : 'Repaso completado · sin gemas extra';
  for (let i = 0; i < 50; i++) createConfetti();
  showScreen('screen-result');
  document.querySelector('#screen-result h1')?.focus();
};

const exitToMap = () => {
  DOM.overlayGameover.classList.remove('active');
  DOM.overlayShop.classList.remove('active');
  showScreen('screen-map');
  document.querySelector('.logo')?.focus();
};
