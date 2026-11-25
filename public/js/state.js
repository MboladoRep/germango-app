// ===== ESTADO GLOBAL, DOM Y GUARDADO =====
let state = { hearts: 5, gems: 500, streak: 0, completed: [], currentQ: 0, answers: [], selected: null, checking: false };
let currentLessonData = null;
let matchState = { first: null, second: null, lock: false, solved: [] };
let DB = { units: [] };

const DOM = {
  hearts: document.getElementById('s-hearts'),
  gems: document.getElementById('s-gems'),
  streak: document.getElementById('s-streak'),
  mapContainer: document.getElementById('map-container'),
  lessonContent: document.getElementById('lesson-content'),
  progressBar: document.getElementById('progress-bar'),
  feedbackMsg: document.getElementById('feedback-msg'),
  msgText: document.getElementById('msg-text'),
  msgSub: document.getElementById('msg-sub'),
  btnAction: document.getElementById('btn-action'),
  screenLesson: document.getElementById('screen-lesson'),
  overlayGameover: document.getElementById('overlay-gameover'),
  overlayShop: document.getElementById('overlay-shop')
};

// La clave NO se cambia para no perder el progreso guardado de los usuarios
const save = () => { try { localStorage.setItem('germango_v92', JSON.stringify(state)); } catch (e) {} };

const loadLocal = () => {
  try {
    const d = localStorage.getItem('germango_v92');
    if (d) {
      const saved = JSON.parse(d);
      const toSafeInt = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(max, Math.max(0, Math.floor(number))) : fallback;
      };
      state.hearts = toSafeInt(saved.hearts, 5, 5);
      state.gems = toSafeInt(saved.gems, 500);
      state.streak = toSafeInt(saved.streak, 0);
      state.completed = Array.isArray(saved.completed) ? [...new Set(saved.completed.filter(id => typeof id === 'string'))] : [];
    }
  } catch (e) {}
  updateUI();
};
