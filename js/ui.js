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
  DOM.gems.innerText = state.gems;
  DOM.streak.innerText = state.streak;
  renderMap();
};

const showScreen = (id) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
};

const openShop = () => { DOM.overlayShop.classList.add('active'); };
const closeShop = () => { DOM.overlayShop.classList.remove('active'); };

const buyLivesRetry = () => {
  if (state.gems >= 50) {
    state.gems -= 50; state.hearts = 5; save(); updateUI();
    DOM.overlayGameover.classList.remove('active');
    startLesson(currentLessonData);
  } else { alert("No tienes suficientes gemas."); }
};

const shopPurchase = (item) => {
  if (item === 'hearts') {
    if (state.gems >= 50) { state.gems -= 50; state.hearts = 5; playSound('correct'); save(); updateUI(); closeShop(); }
    else { alert("Gemas insuficientes"); playSound('wrong'); }
  }
};

const renderMap = () => {
  if (DB.units.length === 0) return;
  DOM.mapContainer.innerHTML = '';
  const allLessons = DB.units.flatMap(u => u.lessons);
  const totalLessons = allLessons.length;
  const progressPercent = totalLessons > 0 ? (state.completed.length / totalLessons) * 100 : 0;

  DOM.mapContainer.innerHTML += `
    <div class="global-progress-container">
      <div class="gp-header"><span>Progreso Global</span><span>${Math.round(progressPercent)}%</span></div>
      <div class="gp-bar"><div class="gp-fill" style="width: ${progressPercent}%"></div></div>
    </div>`;

  let globalIndex = 0;
  DB.units.forEach((unit) => {
    const unitDiv = document.createElement('div');
    unitDiv.className = 'unit-container';
    const header = document.createElement('div');
    header.className = 'unit-header';
    header.innerHTML = `<div class="unit-title">${unit.title}</div><div class="unit-sub">${unit.subtitle}</div>`;
    unitDiv.appendChild(header);

    const lessonsRow = document.createElement('div');
    lessonsRow.className = 'lessons-row';
    unit.lessons.forEach((les) => {
      const node = document.createElement('div');
      node.className = 'lesson-node';
      if (globalIndex === 0) node.classList.add('first-node');

      const isDone = state.completed.includes(les.id);
      const prevLesson = globalIndex > 0 ? allLessons[globalIndex - 1] : null;
      const prevDone = prevLesson ? state.completed.includes(prevLesson.id) : false;
      const isUnlocked = (globalIndex === 0) || prevDone;

      if (isDone) { node.classList.add('completed'); node.innerHTML = `<span class="icon">✓</span>`; }
      else if (isUnlocked) { node.classList.add('current'); node.innerHTML = `<span class="icon">${les.icon}</span>`; }
      else { node.classList.add('locked'); node.innerHTML = `<span class="icon">🔒</span>`; }

      if (!node.classList.contains('locked')) node.onclick = () => startLesson(les);
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
