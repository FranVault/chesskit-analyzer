// =============================================
// Chesskit Quick Analyze - Chess.com Script v5
// =============================================

const BUTTON_ID = 'chesskit-open-btn';

function getUsername() {
  try {
    // Atributo estable detectado via DevTools: data-test-element="user-tagline-username"
    // El panel inferior siempre es el jugador local
    const bottomPanel = document.getElementById('board-layout-player-bottom');
    if (bottomPanel) {
      const el = bottomPanel.querySelector('[data-test-element="user-tagline-username"]');
      const txt = el?.textContent?.trim();
      if (txt) { console.log('[Chesskit] Usuario (panel inferior):', txt); return txt; }
    }
    // Fallback: el ultimo elemento con ese atributo = jugador de abajo
    const els = document.querySelectorAll('[data-test-element="user-tagline-username"]');
    if (els.length >= 1) {
      const txt = els[els.length - 1]?.textContent?.trim();
      if (txt) { console.log('[Chesskit] Usuario (tagline):', txt); return txt; }
    }
  } catch (_) {}
  return '';
}

function injectButton(targetEl) {
  if (document.getElementById(BUTTON_ID)) return;

  let container = null;
  const allButtons = targetEl.querySelectorAll('button, [role="button"]');
  let referenceBtn = null;

  for (const btn of allButtons) {
    const txt = btn.textContent.trim();
    if (txt.includes('Nueva') || txt.includes('New') || txt.includes('Revancha') || txt.includes('Rematch')) {
      referenceBtn = btn;
      break;
    }
  }

  if (referenceBtn) {
    container = referenceBtn.parentElement;
  } else {
    const allDivs = targetEl.querySelectorAll('div');
    for (const div of [...allDivs].reverse()) {
      if (div.querySelectorAll('button, [role="button"]').length >= 2) { container = div; break; }
    }
  }

  if (!container) { console.warn('[Chesskit] No se encontro contenedor'); return; }

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = '♟ Analizar en Chesskit';
  btn.style.cssText = `
    display: block !important; width: 100% !important; padding: 12px 16px !important;
    margin-top: 8px !important; background: linear-gradient(135deg, #1565c0, #1a73e8) !important;
    color: #fff !important; border: none !important; border-radius: 6px !important;
    font-size: 14px !important; font-weight: 700 !important; cursor: pointer !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important; font-family: inherit !important;
  `;
  btn.onmouseenter = () => (btn.style.opacity = '0.85');
  btn.onmouseleave = () => (btn.style.opacity = '1');

  btn.addEventListener('click', async () => {
    let username = getUsername();
    if (!username) {
      const saved = await chrome.storage.local.get('chesskitSavedUsername');
      username = saved.chesskitSavedUsername || '';
    }
    if (!username) {
      alert('Chesskit Analyzer: No se pudo detectar tu usuario. Configuralo haciendo clic en el icono de la extension.');
      return;
    }
    await chrome.storage.local.set({ chesskitAutoLoad: true, chesskitUsername: username, chesskitTimestamp: Date.now() });
    window.open('https://chesskit.org', '_blank');
  });

  container.appendChild(btn);
  console.log('[Chesskit] Boton inyectado');
}

function findGameOverModal() {
  const triggerWords = ['Has Ganado', 'You Won', 'Has Perdido', 'You Lost', 'Tablas', 'Draw'];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    if (['SCRIPT','STYLE','SVG','PATH'].includes(node.tagName)) continue;
    const ownText = [...node.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent.trim()).join('');
    for (const word of triggerWords) {
      if (ownText.includes(word)) {
        let candidate = node;
        for (let i = 0; i < 8; i++) {
          if (!candidate.parentElement) break;
          candidate = candidate.parentElement;
          const rect = candidate.getBoundingClientRect();
          if (rect.width > 200 && rect.height > 200) return candidate;
        }
      }
    }
  }
  return null;
}

let lastCheck = 0;
const observer = new MutationObserver(() => {
  const now = Date.now();
  if (now - lastCheck < 300) return;
  lastCheck = now;
  if (document.getElementById(BUTTON_ID)) return;
  const modal = findGameOverModal();
  if (modal) injectButton(modal);
});
observer.observe(document.body, { childList: true, subtree: true });
setTimeout(() => { if (!document.getElementById(BUTTON_ID)) { const m = findGameOverModal(); if (m) injectButton(m); } }, 1000);
