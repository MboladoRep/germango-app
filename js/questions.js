// ===== GENERADOR DE PREGUNTAS (tipos: choice, audio, match, speak, wordbank) =====
const getRandom = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateQuestion(type, categoryKey) {
  const category = VOCAB[categoryKey];
  if (!category) return null;
  const item = getRandomItem(category);
  let wrongOptions = category.filter(i => i.de !== item.de);
  if (wrongOptions.length < 3) wrongOptions = Object.values(VOCAB).flat();
  const distractors = getRandom(wrongOptions, 3).map(i => i.es);
  const options = [item.es, ...distractors].sort(() => 0.5 - Math.random());

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
      const words = getRandom(category, 3);
      return {
        type: 'wordbank', prompt: 'Ordena las palabras (concepto)',
        text: words.map(w => w.de).join(' + '),
        words: words.map(w => w.de).sort(() => 0.5 - Math.random()),
        correct: words.map(w => w.de)
      };
    }
    default:
      return null;
  }
}
