// ===== RECONOCIMIENTO DE VOZ ("Toca para hablar") + MODO ESCRITURA =====
// Pensado para iPhone/Safari: instancia nueva en cada toque, start() síncrono dentro del gesto,
// se corta la síntesis de voz antes de grabar y se muestran mensajes de error concretos.
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

const SPEECH_ERRORS = {
  'not-allowed': 'Micrófono bloqueado. En iPhone: Ajustes › Safari › Micrófono › Permitir (o toca "aA" en la barra › Configuración del sitio).',
  'service-not-allowed': 'Activa el dictado: Ajustes › General › Teclado › Activar dictado (y Siri activado).',
  'no-speech': 'No te he oído. Toca y habla otra vez.',
  'audio-capture': 'No se detecta ningún micrófono.',
  'network': 'Sin conexión: el reconocimiento de voz necesita internet.',
  'language-not-supported': 'El dictado en alemán no está disponible en este dispositivo.',
  'aborted': ''
};

// iOS suele devolver cifras ("2") en vez de palabras ("zwei")
const NUM_DE = { '1': 'eins', '2': 'zwei', '3': 'drei', '4': 'vier', '5': 'fünf', '6': 'sechs', '7': 'sieben', '8': 'acht', '9': 'neun', '10': 'zehn', '11': 'elf', '12': 'zwölf', '20': 'zwanzig', '100': 'hundert' };

const normalizeText = (t) => (t || '')
  .normalize('NFC').toLowerCase().replace(/ß/g, 'ss')
  .replace(/[^\p{L}\p{N} ]/gu, ' ')
  .split(/\s+/).filter(Boolean)
  .map(w => NUM_DE[w] || w).join(' ');

const isSpeechMatch = (spoken, target) => {
  const s = normalizeText(spoken), t = normalizeText(target);
  if (!s || !t) return false;
  if (s === t || s.includes(t)) return true;
  const sw = s.split(' ');
  return t.split(' ').every(w => sw.includes(w));
};

const resetMicBtn = () => {
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) { micBtn.classList.remove('listening'); micBtn.innerText = '🎤 Toca para hablar'; }
};

const triggerSpeech = () => {
  const micBtn = document.getElementById('mic-btn');
  const resultDiv = document.getElementById('mic-result');
  if (!micBtn || !resultDiv || state.checking) return;

  if (!SpeechRec) {
    resultDiv.innerText = 'Este navegador no admite reconocimiento de voz. Escribe la respuesta.';
    switchToTyping();
    return;
  }
  if (isListening) { try { recognition.stop(); } catch (e) {} return; }

  try { window.speechSynthesis.cancel(); } catch (e) {}   // libera el audio antes de grabar (iOS)

  const target = currentLessonData.questions[state.currentQ].text;
  recognition = new SpeechRec();
  recognition.lang = 'de-DE';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    micBtn.innerText = '🔴 Escuchando... (toca para parar)';
    resultDiv.innerText = '';
  };
  recognition.onresult = (ev) => {
    const alts = Array.from(ev.results[0]).map(a => a.transcript);
    const best = alts.find(a => isSpeechMatch(a, target)) || alts[0];
    resultDiv.innerText = `Dijiste: "${best}"`;
    checkSpeechResult(best);
  };
  recognition.onerror = (ev) => {
    const msg = SPEECH_ERRORS[ev.error];
    if (msg !== '') resultDiv.innerText = msg || `Error de voz (${ev.error}). Prueba a escribir.`;
  };
  recognition.onend = () => { isListening = false; resetMicBtn(); };

  try { recognition.start(); }
  catch (e) {
    isListening = false; resetMicBtn();
    resultDiv.innerText = 'No se pudo iniciar el micrófono. Prueba a escribir.';
  }
};

const checkSpeechResult = (spokenText) => {
  if (state.checking) return;
  const target = currentLessonData.questions[state.currentQ].text;
  state.selected = spokenText;
  DOM.btnAction.classList.add('active');
  if (isSpeechMatch(spokenText, target)) handleAction();   // acierto: comprueba solo
};

const switchToTyping = () => {
  const container = document.getElementById('speak-ui');
  if (!container) return;
  try { if (recognition) recognition.abort(); } catch (e) {}
  container.innerHTML = `
    <input type="text" class="text-input-fallback" id="write-input" placeholder="Escribe aquí..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" oninput="checkTypingResult()">
<button class="no-mic-btn" onclick="speak(currentLessonData.questions[state.currentQ].text)">🔊 Repetir audio</button>  `;
  document.getElementById('write-input').focus();
};

const checkTypingResult = () => {
  const input = document.getElementById('write-input');
  if (!input) return;
  const val = input.value.trim();
  if (val.length > 0) { state.selected = val; DOM.btnAction.classList.add('active'); }
  else { state.selected = null; DOM.btnAction.classList.remove('active'); }
};
