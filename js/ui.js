// ===== INTERFAZ: cabecera, pantallas, tienda, mapa de lecciones, confeti =====
function buildCourseMap() {
  return COURSE_STRUCTURE.map((u, uIndex) => ({
    id: u.id, title: u.title, subtitle: u.subtitle, order_index: uIndex,
    lessons: u.lessons.map((catKey, lIndex) => ({
      id: `${u.id}-l${lIndex}`,
      icon: lIndex === 0 ? '📘' : (lIndex === 1 ? '📗' : '📙'),
      order_index: lIndex, category: catKey, questions: []
    }))
  }));
}

async function fetchCourseData() {
  DB.units = buildCourseMap();
  renderMap();
}

const updateUI = () => {
  DOM.hearts.innerText = state.hearts;
  DOM.hearts.parentElement.setAttribute('aria-label', `Vidas disponibles: ${state.hearts}. Abrir tienda.`);
  DOM.gems.innerText = state.gems;
  DOM.streak.innerText = state.streak;
  const heartPurchase = DOM.overlayShop.querySelector('.shop-item');
  if (heartPurchase) {
    heartPurchase.disabled = state.hearts >= 5;
    heartPurchase.setAttribute('aria-label', state.hearts >= 5 ? 'Ya tienes todas tus vidas' : 'Recargar vidas por 50 gemas');
  }
  renderMap();
};

const showScreen = (id) => {
  const nextScreen = document.getElementById(id);
  if (!nextScreen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  nextScreen.classList.add('active');
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' });
};

let shopTrigger = null;
const openShop = () => {
  shopTrigger = document.activeElement;
  DOM.overlayShop.classList.add('active');
  DOM.overlayShop.querySelector('button:not(:disabled)')?.focus();
};
const closeShop = () => {
  DOM.overlayShop.classList.remove('active');
  if (shopTrigger instanceof HTMLElement && document.body.contains(shopTrigger)) shopTrigger.focus();
};
const openGameOver = () => {
  DOM.overlayGameover.classList.add('active');
  DOM.overlayGameover.querySelector('button:not(:disabled)')?.focus();
};

document.addEventListener('keydown', event => {
  const dialog = [DOM.overlayShop, DOM.overlayGameover].find(overlay => overlay.classList.contains('active'));
  if (!dialog) return;
  if (event.key === 'Escape') {
    if (dialog === DOM.overlayShop) closeShop();
    else exitToMap();
    return;
  }
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), [href]')];
  if (!controls.length) return;
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});

const buyLivesRetry = () => {
  if (state.gems >= 50) {
    state.gems -= 50; state.hearts = 5; save(); updateUI();
    DOM.overlayGameover.classList.remove('active');
    startLesson(currentLessonData);
  } else { alert("No tienes suficientes gemas."); }
};

const shopPurchase = (item) => {
  if (item === 'hearts') {
    if (state.hearts >= 5) { alert('Ya tienes todas tus vidas.'); return; }
    if (state.gems >= 50) { state.gems -= 50; state.hearts = 5; playSound('correct'); save(); updateUI(); closeShop(); }
    else { alert("Gemas insuficientes"); playSound('wrong'); }
  }
};

const CATEGORY_LABELS = {
  greetings: 'Saludos', family: 'Familia', food: 'Comida', animals: 'Animales',
  numbers: 'Números', time: 'Tiempo', colors: 'Colores', verbs: 'Verbos',
  body: 'El cuerpo', house: 'La casa', weather: 'El clima',
  transport: 'Transporte', professions: 'Profesiones'
};

const renderMap = () => {
  if (DB.units.length === 0) return;
  DOM.mapContainer.innerHTML = '';
  const allLessons = DB.units.flatMap(unit => unit.lessons);
  const completedSet = new Set(state.completed);
  const completedCount = allLessons.filter(lesson => completedSet.has(lesson.id)).length;
  const progressPercent = allLessons.length ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const nextLesson = allLessons.find(lesson => !completedSet.has(lesson.id)) || allLessons[0];
  const nextUnit = DB.units.find(unit => unit.lessons.some(lesson => lesson.id === nextLesson?.id));
  const nextLabel = nextLesson ? `${CATEGORY_LABELS[nextLesson.category] || 'Alemán'} · ${nextUnit?.title || ''}` : 'Tu ruta de alemán';

  const welcome = document.createElement('section');
  welcome.className = 'welcome-card';
  welcome.innerHTML = `<div class="welcome-copy">
    <span class="welcome-eyebrow">GERMANGO · TU RUTA DE ALEMÁN</span>
    <h1>Aprende alemán, un paso cada día</h1>
    <p>${completedCount === allLessons.length ? '¡Has completado la ruta! Sigue repasando para mantenerlo fresco.' : `Continúa con <strong>${nextLabel}</strong>`}</p>
    <button class="continue-button" id="continue-lesson" type="button">${completedCount === allLessons.length ? 'Repasar una lección' : 'Continuar aprendiendo'}</button>
  </div><div class="welcome-mascot" aria-hidden="true">Hallo!</div>`;
  welcome.querySelector('#continue-lesson').onclick = () => startLesson(nextLesson);
  DOM.mapContainer.appendChild(welcome);

  const progress = document.createElement('section');
  progress.className = 'global-progress-container';
  progress.setAttribute('aria-label', 'Progreso general del curso');
  progress.innerHTML = `<div class="gp-header"><strong>Tu progreso</strong><span>${completedCount} de ${allLessons.length} lecciones · ${progressPercent}%</span></div>
    <div class="gp-bar" role="progressbar" aria-label="Progreso del curso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}"><div class="gp-fill" style="width: ${progressPercent}%"></div></div>`;
  DOM.mapContainer.appendChild(progress);

  let globalIndex = 0;
  DB.units.forEach(unit => {
    const unitDiv = document.createElement('section');
    unitDiv.className = 'unit-container';
    const header = document.createElement('div');
    header.className = 'unit-header';
    header.innerHTML = `<h2 class="unit-title">${unit.title}</h2><p class="unit-sub">${unit.subtitle}</p>`;
    unitDiv.appendChild(header);

    const lessonsRow = document.createElement('div');
    lessonsRow.className = 'lessons-row';
    lessonsRow.setAttribute('role', 'group');
    lessonsRow.setAttribute('aria-label', `Lecciones de ${unit.title}`);
    unit.lessons.forEach(lesson => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'lesson-node';
      if (globalIndex === 0) node.classList.add('first-node');

      const isDone = completedSet.has(lesson.id);
      const previousLesson = globalIndex > 0 ? allLessons[globalIndex - 1] : null;
      const isUnlocked = globalIndex === 0 || (previousLesson && completedSet.has(previousLesson.id));
      const lessonLabel = `${CATEGORY_LABELS[lesson.category] || 'Lección'} · ${unit.title}`;

      if (isDone) {
        node.classList.add('completed');
        node.innerHTML = '<span class="icon" aria-hidden="true">✓</span>';
        node.setAttribute('aria-label', `${lessonLabel}, completada`);
      } else if (isUnlocked) {
        node.classList.add('current');
        node.innerHTML = `<span class="icon" aria-hidden="true">${lesson.icon}</span>`;
        node.setAttribute('aria-label', `${lessonLabel}, empezar`);
      } else {
        node.classList.add('locked');
        node.innerHTML = '<span class="icon" aria-hidden="true">🔒</span>';
        node.setAttribute('aria-label', `${lessonLabel}, bloqueada`);
        node.disabled = true;
      }

      if (isUnlocked) node.onclick = () => startLesson(lesson);
      lessonsRow.appendChild(node);
      globalIndex++;
    });
    unitDiv.appendChild(lessonsRow);
    DOM.mapContainer.appendChild(unitDiv);
  });
};

function createConfetti() {
  const c = document.createElement('div');
  c.className = 'confetti';
  c.style.left = Math.random() * 100 + 'vw';
  c.style.background = ['#58CC02', '#FFC800', '#1CB0F6'][Math.floor(Math.random() * 3)];
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 3000);
}
