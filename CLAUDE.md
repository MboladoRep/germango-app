# GERMANGO – guía para IA (leer primero, ~1 min)

App web estática para aprender alemán (estilo Duolingo). HTML + CSS + JS clásico, **sin build ni frameworks**.
Se abre con `index.html`. Los scripts NO son módulos: las funciones son globales porque el HTML usa `onclick="..."`.
Para el micrófono en iPhone la página debe servirse por **https** (p. ej. GitHub Pages).

## Mapa: qué archivo tocar
| Quiero cambiar… | Archivo |
|---|---|
| Palabras / categorías de vocabulario | `js/data/vocab.js` |
| Unidades y lecciones del mapa | `js/data/course.js` |
| Tipos de pregunta y su generación | `js/questions.js` |
| Cómo se pinta cada pregunta, comprobar, vidas, fin de lección | `js/lesson.js` |
| Micrófono "Toca para hablar", modo escritura, comparación de voz | `js/speech.js` |
| Mapa, tienda, cabecera, confeti | `js/ui.js` |
| Sonidos y voz (síntesis alemana) | `js/audio.js` |
| Estado (vidas, gemas, racha), guardado local | `js/state.js` |
| Supabase (hoy sin uso real) | `js/config.js` |
| Estilos | `css/styles.css` |
| Estructura HTML / pantallas / orden de scripts | `index.html` |

## Reglas
- Orden de carga (index.html): config → data/vocab → data/course → state → audio → questions → ui → speech → lesson → main. Si añades un archivo, regístralo ahí.
- Editar solo la función afectada; no reescribir archivos completos ni reformatear.
- No renombrar funciones usadas en `onclick`: showScreen, openShop, closeShop, shopPurchase, buyLivesRetry, handleAction, exitToMap, speak, selectChoice, selectMatch, addWord, clearLastWord, triggerSpeech, switchToTyping, checkTypingResult.
- La clave de localStorage `germango_v92` no se cambia (se perdería el progreso).
- Textos de la app en español; el alemán solo en el contenido a aprender.

## Cómo pedir cambios a una IA (ahorra tokens)
Pasa solo: este `CLAUDE.md` + el/los archivos del mapa afectados. Pide "dame solo la función modificada" o un parche por archivo.
