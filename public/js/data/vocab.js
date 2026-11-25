// ===== BANCO DE VOCABULARIO =====
// Para añadir palabras: agrega { de, es, emoji } a la categoría. Para una categoría nueva, añádela aquí y úsala en course.js.
const VOCAB = {
  greetings: [
    { de: 'Hallo', es: 'Hola', emoji: '👋' }, { de: 'Guten Morgen', es: 'Buenos días', emoji: '☀️' },
    { de: 'Guten Tag', es: 'Buenas tardes', emoji: '🌤️' }, { de: 'Guten Abend', es: 'Buenas noches (saludo)', emoji: '🌙' },
    { de: 'Tschüss', es: 'Adiós (informal)', emoji: '👋' }, { de: 'Auf Wiedersehen', es: 'Adiós (formal)', emoji: '🎩' },
    { de: 'Danke', es: 'Gracias', emoji: '🙏' }, { de: 'Bitte', es: 'Por favor', emoji: '🙏' },
    { de: 'Entschuldigung', es: 'Disculpa', emoji: '🤷' }, { de: 'Wie geht es dir?', es: '¿Cómo estás?', emoji: '🤔' }
  ],
  family: [
    { de: 'der Vater', es: 'El padre', emoji: '👨' }, { de: 'die Mutter', es: 'La madre', emoji: '👩' },
    { de: 'der Bruder', es: 'El hermano', emoji: '👦' }, { de: 'die Schwester', es: 'La hermana', emoji: '👧' },
    { de: 'der Sohn', es: 'El hijo', emoji: '👦' }, { de: 'die Tochter', es: 'La hija', emoji: '👧' },
    { de: 'die Oma', es: 'La abuela', emoji: '👵' }, { de: 'der Opa', es: 'El abuelo', emoji: '👴' },
    { de: 'die Familie', es: 'La familia', emoji: '👨‍👩‍👧‍👦' }, { de: 'das Kind', es: 'El niño', emoji: '👶' }
  ],
  food: [
    { de: 'der Apfel', es: 'La manzana', emoji: '🍎' }, { de: 'das Brot', es: 'El pan', emoji: '🍞' },
    { de: 'das Wasser', es: 'El agua', emoji: '💧' }, { de: 'die Milch', es: 'La leche', emoji: '🥛' },
    { de: 'der Käse', es: 'El queso', emoji: '🧀' }, { de: 'das Fleisch', es: 'La carne', emoji: '🥩' },
    { de: 'der Fisch', es: 'El pescado', emoji: '🐟' }, { de: 'das Ei', es: 'El huevo', emoji: '🥚' },
    { de: 'die Suppe', es: 'La sopa', emoji: '🍲' }, { de: 'der Salat', es: 'La ensalada', emoji: '🥗' },
    { de: 'der Kuchen', es: 'El pastel', emoji: '🍰' }, { de: 'die Pizza', es: 'La pizza', emoji: '🍕' }
  ],
  animals: [
    { de: 'der Hund', es: 'El perro', emoji: '🐕' }, { de: 'die Katze', es: 'El gato', emoji: '🐱' },
    { de: 'der Vogel', es: 'El pájaro', emoji: '🐦' }, { de: 'der Fisch', es: 'El pez', emoji: '🐟' },
    { de: 'das Pferd', es: 'El caballo', emoji: '🐴' }, { de: 'die Kuh', es: 'La vaca', emoji: '🐄' },
    { de: 'das Schwein', es: 'El cerdo', emoji: '🐷' }, { de: 'das Schaf', es: 'La oveja', emoji: '🐑' },
    { de: 'die Maus', es: 'El ratón', emoji: '🐭' }, { de: 'der Elefant', es: 'El elefante', emoji: '🐘' },
    { de: 'der Löwe', es: 'El león', emoji: '🦁' }, { de: 'der Bär', es: 'El oso', emoji: '🐻' },
    { de: 'der Wolf', es: 'El lobo', emoji: '🐺' }, { de: 'der Fuchs', es: 'El zorro', emoji: '🦊' }
  ],
  numbers: [
    { de: 'eins', es: 'uno' }, { de: 'zwei', es: 'dos' }, { de: 'drei', es: 'tres' },
    { de: 'vier', es: 'cuatro' }, { de: 'fünf', es: 'cinco' }, { de: 'sechs', es: 'seis' },
    { de: 'sieben', es: 'siete' }, { de: 'acht', es: 'ocho' }, { de: 'neun', es: 'nueve' },
    { de: 'zehn', es: 'diez' }, { de: 'elf', es: 'once' }, { de: 'zwölf', es: 'doce' },
    { de: 'zwanzig', es: 'veinte' }, { de: 'hundert', es: 'cien' }
  ],
  time: [
    { de: 'der Montag', es: 'Lunes' }, { de: 'der Dienstag', es: 'Martes' },
    { de: 'der Mittwoch', es: 'Miércoles' }, { de: 'der Donnerstag', es: 'Jueves' },
    { de: 'der Freitag', es: 'Viernes' }, { de: 'der Samstag', es: 'Sábado' },
    { de: 'der Sonntag', es: 'Domingo' }, { de: 'Heute', es: 'Hoy' },
    { de: 'Morgen', es: 'Mañana' }, { de: 'Gestern', es: 'Ayer' },
    { de: 'die Uhr', es: 'El reloj' }, { de: 'die Zeit', es: 'El tiempo' }
  ],
  colors: [
    { de: 'rot', es: 'rojo', emoji: '🔴' }, { de: 'blau', es: 'azul', emoji: '🔵' },
    { de: 'grün', es: 'verde', emoji: '🟢' }, { de: 'gelb', es: 'amarillo', emoji: '🟡' },
    { de: 'schwarz', es: 'negro', emoji: '⬛' }, { de: 'weiß', es: 'blanco', emoji: '⬜' },
    { de: 'orange', es: 'naranja', emoji: '🟠' }, { de: 'rosa', es: 'rosa', emoji: '💗' },
    { de: 'braun', es: 'marrón', emoji: '🟤' }, { de: 'grau', es: 'gris', emoji: '🩶' }
  ],
  verbs: [
    { de: 'essen', es: 'comer', emoji: '🍽️' }, { de: 'trinken', es: 'beber', emoji: '🍺' },
    { de: 'gehen', es: 'ir/caminar', emoji: '🚶' }, { de: 'kommen', es: 'venir', emoji: '🤚' },
    { de: 'schlafen', es: 'dormir', emoji: '😴' }, { de: 'lesen', es: 'leer', emoji: '📖' },
    { de: 'schreiben', es: 'escribir', emoji: '✍️' }, { de: 'sprechen', es: 'hablar', emoji: '🗣️' },
    { de: 'hören', es: 'escuchar', emoji: '👂' }, { de: 'sehen', es: 'ver', emoji: '👀' },
    { de: 'kaufen', es: 'comprar', emoji: '🛒' }, { de: 'verkaufen', es: 'vender', emoji: '🏷️' },
    { de: 'laufen', es: 'correr', emoji: '🏃' }, { de: 'schwimmen', es: 'nadar', emoji: '🏊' }
  ],
  body: [
    { de: 'der Kopf', es: 'La cabeza', emoji: '🗣️' }, { de: 'der Arm', es: 'El brazo', emoji: '💪' },
    { de: 'das Bein', es: 'La pierna', emoji: '🦵' }, { de: 'die Hand', es: 'La mano', emoji: '✋' },
    { de: 'der Fuß', es: 'El pie', emoji: '🦶' }, { de: 'das Auge', es: 'El ojo', emoji: '👁️' },
    { de: 'die Nase', es: 'La nariz', emoji: '👃' }, { de: 'der Mund', es: 'La boca', emoji: '👄' },
    { de: 'das Ohr', es: 'La oreja', emoji: '👂' }, { de: 'das Haar', es: 'El pelo', emoji: '💇' }
  ],
  house: [
    { de: 'das Haus', es: 'La casa', emoji: '🏠' }, { de: 'die Tür', es: 'La puerta', emoji: '🚪' },
    { de: 'das Fenster', es: 'La ventana', emoji: '🪟' }, { de: 'der Tisch', es: 'La mesa', emoji: '🪑' },
    { de: 'der Stuhl', es: 'La silla', emoji: '🪑' }, { de: 'das Bett', es: 'La cama', emoji: '🛏️' },
    { de: 'die Küche', es: 'La cocina', emoji: '🍳' }, { de: 'das Badezimmer', es: 'El baño', emoji: '🛁' },
    { de: 'das Schlafzimmer', es: 'El dormitorio', emoji: '🛌' }, { de: 'der Garten', es: 'El jardín', emoji: '🌳' }
  ],
  weather: [
    { de: 'die Sonne', es: 'El sol', emoji: '☀️' }, { de: 'der Regen', es: 'La lluvia', emoji: '🌧️' },
    { de: 'der Schnee', es: 'La nieve', emoji: '❄️' }, { de: 'der Wind', es: 'El viento', emoji: '💨' },
    { de: 'die Wolke', es: 'La nube', emoji: '☁️' }, { de: 'der Himmel', es: 'El cielo', emoji: '🌌' },
    { de: 'kalt', es: 'frío', emoji: '🥶' }, { de: 'warm', es: 'cálido', emoji: '🌡️' },
    { de: 'heiß', es: 'caluroso', emoji: '🥵' }, { de: 'das Wetter', es: 'El clima', emoji: '🌦️' }
  ],
  transport: [
    { de: 'das Auto', es: 'El coche', emoji: '🚗' }, { de: 'der Zug', es: 'El tren', emoji: '🚆' },
    { de: 'das Flugzeug', es: 'El avión', emoji: '✈️' }, { de: 'das Schiff', es: 'El barco', emoji: '🚢' },
    { de: 'das Fahrrad', es: 'La bicicleta', emoji: '🚲' }, { de: 'der Bus', es: 'El autobús', emoji: '🚌' },
    { de: 'die Straße', es: 'La calle', emoji: '🛣️' }, { de: 'die Brücke', es: 'El puente', emoji: '🌉' }
  ],
  professions: [
    { de: 'der Arzt', es: 'El médico', emoji: '👨‍⚕️' }, { de: 'der Lehrer', es: 'El profesor', emoji: '👨‍🏫' },
    { de: 'der Polizist', es: 'El policía', emoji: '👮' }, { de: 'der Koch', es: 'El cocinero', emoji: '👨‍🍳' },
    { de: 'der Ingenieur', es: 'El ingeniero', emoji: '👷' }, { de: 'der Schüler', es: 'El estudiante', emoji: '👦' },
    { de: 'der Fahrer', es: 'El conductor', emoji: '🚕' }, { de: 'der Musiker', es: 'El músico', emoji: '🎸' }
  ]
};
