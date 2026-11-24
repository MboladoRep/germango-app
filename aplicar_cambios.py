#!/usr/bin/env python3
"""Aplica a index.html: (1) scroll automatico a la leccion actual + boton
"SIGUIENTE LECCION", (2) ejercicio de tarjetas ES->DE, (3) 3 arreglos menores.
Uso (en la carpeta del repo):  python3 aplicar_cambios.py
Si algun fragmento no coincide, NO modifica nada y te dice cual."""
import sys, shutil

F = 'index.html'
src = open(F, encoding='utf-8').read()
edits = []
def rep(old, new): edits.append((old, new))

# --- CSS ---
rep('</style>', r'''input { user-select: text; -webkit-user-select: text; }
.deck { position: relative; width: 100%; height: 150px; margin: 10px 0 18px; }
.card-layer { position: absolute; inset: 0; background: var(--card-dark); border: 2px solid var(--border-color); border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: transform .35s, opacity .35s; }
.card-layer.l1 { transform: translateY(8px) scale(.96); opacity: .7; }
.card-layer.l2 { transform: translateY(16px) scale(.92); opacity: .4; }
.card-layer.top { z-index: 3; font-size: 1.6rem; font-weight: 700; }
.card-layer.fly-ok { transform: translateX(120%) rotate(15deg); opacity: 0; border-color: var(--primary-green); }
.card-layer.fly-bad { animation: shake .3s; border-color: var(--error-red); }
.deck-info { text-align: center; color: var(--text-dim); font-size: .85rem; }
</style>''')

# --- Pantalla de resultado: boton directo a la siguiente leccion ---
rep('<button class="btn-main active" onclick="exitToMap()">CONTINUAR</button>',
    '<button class="btn-main active" onclick="goNextLesson()">SIGUIENTE LECCIÓN</button>'
    '<button class="btn-main" style="margin-top:10px;background:#333;border-bottom-color:#222;color:#aaa;pointer-events:all;" onclick="exitToMap()">VOLVER AL MAPA</button>')

# --- Mezcla sin mutar los arrays originales ---
rep('const getRandom = (arr, n) => arr.sort(() => 0.5 - Math.random()).slice(0, n);',
    'const getRandom = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);')

# --- Generador de la pregunta tipo tarjetas ---
rep("case 'wordbank':", r'''case 'cards':
return { type: 'cards', prompt: 'Tarjetas: escribe o di la palabra en alemán',
  deck: getRandom(category, Math.min(5, category.length)).map(i => ({ es: i.es, de: i.de, emoji: i.emoji || '' })) };
case 'wordbank':''')

# --- Orden de ejercicios + proteccion de vidas a 0 ---
rep("const qTypes = ['choice', 'choice', 'match', 'audio', 'speak'];",
    "const qTypes = ['choice', 'choice', 'match', 'cards', 'audio', 'speak'];")
rep('const startLesson = (les) => {',
    "const startLesson = (les) => {\nif (state.hearts <= 0) { currentLessonData = les; DOM.overlayGameover.classList.add('active'); return; }")

# --- Render de las tarjetas ---
rep("if (q.type === 'speak' && 'webkitSpeechRecognition' in window) {",
    "if ((q.type === 'speak' || q.type === 'cards') && 'webkitSpeechRecognition' in window) {")
rep("else if (q.type === 'wordbank') {", r'''else if (q.type === 'cards') {
const top = q.deck[0];
const l2 = q.deck.length > 2 ? '<div class="card-layer l2"></div>' : '';
const l1 = q.deck.length > 1 ? '<div class="card-layer l1"></div>' : '';
html += `<div class="deck-info">Tarjetas restantes: ${q.deck.length}</div>
<div class="deck">${l2}${l1}<div class="card-layer top" id="card-top"><span style="font-size:2.2rem">${esc(top.emoji)}</span><span>${esc(top.es)}</span></div></div>
<input type="text" class="text-input-fallback" id="card-input" placeholder="En alemán..." autocomplete="off" autocapitalize="off" spellcheck="false" oninput="checkCardInput()" onkeydown="if(event.key==='Enter'){handleAction()}">
<button class="write-mode-btn" onclick="cardMic()">🎤 Decirlo en voz alta</button>
<div class="mic-feedback" id="mic-result"></div>`;
setTimeout(() => { const i = document.getElementById('card-input'); if (i) i.focus(); }, 100);
}
else if (q.type === 'wordbank') {''')

# --- Comprobacion de la tarjeta ---
rep("else if (q.type === 'wordbank') isCorrect = JSON.stringify(state.answers) === JSON.stringify(q.correct);",
    r'''else if (q.type === 'wordbank') isCorrect = JSON.stringify(state.answers) === JSON.stringify(q.correct);
else if (q.type === 'cards') {
const nz = s => s.toLowerCase().replace(/[.,!?¿¡]/g, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();
const a = nz(state.selected), c = nz(q.deck[0].de);
isCorrect = a === c || a === c.replace(/^(der|die|das) /, '');
q.lastCorrect = isCorrect;
const t = document.getElementById('card-top'); if (t) t.classList.add(isCorrect ? 'fly-ok' : 'fly-bad');
}''')
rep('sub.innerText = feedbackSub;',
    "if (q.type === 'cards') feedbackSub = q.deck[0].de;\nsub.innerText = feedbackSub;")
rep('if (q.type === \'wordbank\') cText = q.correct.join(" ");',
    'if (q.type === \'wordbank\') cText = q.correct.join(" ");\nif (q.type === \'cards\') cText = q.deck[0].de;')
rep('state.hearts--; updateUI(); save();',
    "if (q.type !== 'cards') { state.hearts--; updateUI(); save(); }")

# --- Avance: la tarjeta acertada desaparece, la fallada va al final ---
rep('state.currentQ++;', r'''if (q.type === 'cards') {
const done = q.deck.shift(); if (!q.lastCorrect) q.deck.push(done);
if (q.deck.length > 0) { state.checking = false; state.selected = null; renderQ(); return; }
}
state.currentQ++;''')

# --- Scroll automatico a la leccion actual + helpers ---
rep("const exitToMap = () => { showScreen('screen-map'); };", r'''const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const scrollToCurrent = () => requestAnimationFrame(() => {
  const n = document.querySelector('.lesson-node.current');
  if (n) n.scrollIntoView({ block: 'center', behavior: 'smooth' });
});
const exitToMap = () => { showScreen('screen-map'); };
const goNextLesson = () => {
  const next = DB.units.flatMap(u => u.lessons).find(l => !state.completed.includes(l.id));
  if (next) startLesson(next); else exitToMap();
};
const checkCardInput = () => {
  if (state.checking) return;
  const v = document.getElementById('card-input').value;
  state.selected = v.trim() ? v : null;
  DOM.btnAction.classList.toggle('active', !!state.selected);
};
const cardMic = () => {
  if (!recognition) { alert('Navegador no soportado.'); return; }
  recognition.onresult = e => { document.getElementById('card-input').value = e.results[0][0].transcript; checkCardInput(); };
  recognition.onerror = () => {};
  try { recognition.start(); } catch (e) {}
};''')
rep("document.getElementById(id).classList.add('active');",
    "document.getElementById(id).classList.add('active');\nif (id === 'screen-map') scrollToCurrent();")
# El INIT llama a fetchCourseData() al final; anadimos el scroll tras ella.
idx = src.rfind('fetchCourseData();')
if idx == -1:
    sys.exit('No encuentro la llamada final a fetchCourseData(); no se ha modificado nada.')

for old, _ in edits:
    n = src.count(old)
    if n != 1:
        sys.exit(f'Fragmento no encontrado (o repetido, {n} veces) -> no se ha modificado nada:\n{old[:90]}')

out = src
for old, new in edits:
    out = out.replace(old, new)
idx = out.rfind('fetchCourseData();')
out = out[:idx] + 'fetchCourseData(); scrollToCurrent();' + out[idx + len('fetchCourseData();'):]

shutil.copy(F, F + '.bak')
open(F, 'w', encoding='utf-8').write(out)
print('Listo. Copia de seguridad en index.html.bak. Haz commit y push para desplegar en Vercel.')
