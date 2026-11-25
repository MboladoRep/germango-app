// ===== GENERADOR DE PREGUNTAS (tipos: choice, audio, match, speak, wordbank) =====
const getRandom = (arr, n) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
};
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateQuestion(type, categoryKey) {
  const category = VOCAB[categoryKey];
  if (!category) return null;
  const item = getRandomItem(category);
  const categoryDistractors = category.filter(i => i.de !== item.de && i.es !== item.es);
  const distractorPool = categoryDistractors.length >= 3
    ? categoryDistractors
    : Object.values(VOCAB).flat().filter(i => i.de !== item.de && i.es !== item.es);
  const distractors = getRandom([...new Set(distractorPool.map(i => i.es))], 3);
  const options = getRandom([item.es, ...distractors], 1 + distractors.length);

  switch (type) {
    case 'choice':
      return { type: 'choice', prompt: `¿Qué significa "${item.de}"?`, text: item.de, options: options, correct: item.es, emoji: item.emoji || '❓' };
    case 'audio':
      return { type: 'audio', prompt: 'Escucha y selecciona el significado', audioText: item.de, options: options, correct: item.es, emoji: '🔊' };
    case 'match': {
      const matchItems = getRandom(category, 4);
      return { type: 'match', prompt: 'Relaciona las parejas', pairs: matchItems.map(i => [i.de, i.es]) };
    }
    case 'speak':
      return { type: 'speak', prompt: 'Di esto en alemán:', text: item.de, meaning: item.es, emoji: item.emoji || '🗣️' };
    case 'wordbank': {
      const correct = item.de.trim().split(/\s+/);
      const distractorPool = category
        .filter(entry => entry.de !== item.de)
        .flatMap(entry => entry.de.trim().split(/\s+/))
        .filter(word => !correct.includes(word));
      const distractors = [...new Set(getRandom(distractorPool, distractorPool.length))].slice(0, 2);
      const words = getRandom([...correct, ...distractors], correct.length + distractors.length);
      return {
        type: 'wordbank', prompt: `¿Cómo se dice "${item.es}" en alemán?`,
        text: item.es, words, correct, emoji: item.emoji || '🗣️'
      };
    }
    default:
      return null;
  }
}
