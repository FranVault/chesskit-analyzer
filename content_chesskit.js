// =============================================
// Chesskit Quick Analyze - Chesskit.org Script v5
// =============================================

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function setReactInputValue(input, value) {
  input.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeSetter) nativeSetter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input',  { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// Espera a que aparezca al menos un elemento que contenga " vs " y sea clickeable
async function waitForGameRows(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const rows = getGameRows();
    if (rows.length > 0) return rows;
    await sleep(200);
  }
  return [];
}

// Busca filas de partida por atributo estable data-sentry-component="GameItem"
function getGameRows() {
  const rows = [...document.querySelectorAll('li[data-sentry-component="GameItem"]')];
  if (rows.length > 0) return rows;
  // Fallback por si cambian el atributo
  return [...document.querySelectorAll('[data-sentry-component="GameItem"]')];
}

async function autoLoadGame(username) {
  console.log('[Chesskit] Iniciando para usuario:', username);
  await sleep(900);

  // 1. Clic en LOAD GAME
  let loadBtn = null;
  for (const btn of document.querySelectorAll('button')) {
    const txt = btn.textContent.toUpperCase().trim();
    if (txt.includes('LOAD') || txt.includes('CARGAR')) { loadBtn = btn; break; }
  }
  if (!loadBtn) { console.warn('[Chesskit] No se encontró LOAD GAME'); return; }
  loadBtn.click();
  await sleep(800);

  // 2. Input de usuario
  let usernameInput = null;
  for (const sel of ['input[placeholder*="Chess.com"]', 'input[placeholder*="chess"]', 'input[placeholder*="username"]', 'input[type="text"]']) {
    usernameInput = document.querySelector(sel);
    if (usernameInput) break;
  }
  if (!usernameInput) { console.warn('[Chesskit] No se encontró el input'); return; }

  // 3. Escribir usuario
  setReactInputValue(usernameInput, username);
  console.log('[Chesskit] Usuario escrito:', username);
  await sleep(800);

  // 4. Buscar autocomplete dropdown y hacer clic si aparece
  let autocompleteClicked = false;
  const acStart = Date.now();
  while (Date.now() - acStart < 2500) {
    const opts = document.querySelectorAll('[role="option"], [role="listbox"] *, [class*="suggestion"] *, [class*="autocomplete"] *, [class*="dropdown"] *');
    for (const el of opts) {
      if (el.textContent.trim().toLowerCase() === username.toLowerCase() && el.getBoundingClientRect().width > 0) {
        el.click();
        autocompleteClicked = true;
        console.log('[Chesskit] ✅ Autocomplete clickeado');
        break;
      }
    }
    if (autocompleteClicked) break;
    await sleep(150);
  }

  // 5. Si no hubo autocomplete, presionar Enter
  if (!autocompleteClicked) {
    console.log('[Chesskit] Presionando Enter como fallback');
    ['keydown','keypress','keyup'].forEach(type =>
      usernameInput.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', keyCode: 13, bubbles: true }))
    );
  }

  // 6. Esperar a que las filas de partida aparezcan (con texto "vs")
  console.log('[Chesskit] Esperando partidas...');
  const rows = await waitForGameRows(8000);

  if (rows.length === 0) {
    console.warn('[Chesskit] No se encontraron filas de partida');
    return;
  }

  console.log('[Chesskit] Partidas encontradas:', rows.length, '— haciendo clic en la primera');
  rows[0].click();
  console.log('[Chesskit] ✅ Primera partida seleccionada');
}

(async () => {
  const result = await chrome.storage.local.get(['chesskitAutoLoad', 'chesskitUsername', 'chesskitTimestamp']);
  if (!result.chesskitAutoLoad) return;
  if (Date.now() - (result.chesskitTimestamp || 0) > 120_000) {
    await chrome.storage.local.remove(['chesskitAutoLoad', 'chesskitUsername', 'chesskitTimestamp']);
    return;
  }
  await chrome.storage.local.remove(['chesskitAutoLoad', 'chesskitUsername', 'chesskitTimestamp']);
  await autoLoadGame(result.chesskitUsername || '');
})();
