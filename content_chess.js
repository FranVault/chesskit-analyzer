// =============================================
// Chesskit Quick Analyze - Chess.com Script v6
// =============================================

const BUTTON_ID = 'chesskit-open-btn';
const BUTTON_ID_SIDEBAR = 'chesskit-open-btn-sidebar';

function getUsername() {
  try {
    const bottomPanel = document.getElementById('board-layout-player-bottom');
    if (bottomPanel) {
      const el = bottomPanel.querySelector('[data-test-element="user-tagline-username"]');
      const txt = el?.textContent?.trim();
      if (txt) return txt;
    }
    const els = document.querySelectorAll('[data-test-element="user-tagline-username"]');
    if (els.length >= 1) {
      const txt = els[els.length - 1]?.textContent?.trim();
      if (txt) return txt;
    }
  } catch (_) {}
  return '';
}

function makeButton(id) {
  const btn = document.createElement('button');
  btn.id = id;
  btn.textContent = '♟ Analyze in Chesskit';
  btn.style.cssText = `
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    width: 100% !important;
    padding: 12px 16px !important;
    margin: 0 !important;
    background: linear-gradient(135deg, #1565c0, #1a73e8) !important;
    color: #fff !important;
    border: none !important;
    border-radius: 6px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    box-shadow: 0 2px 12px rgba(26,115,232,0.45) !important;
    font-family: inherit !important;
    letter-spacing: 0.2px !important;
    transition: opacity 0.15s !important;
  `;
  btn.onmouseenter = () => (btn.style.opacity = '0.88');
  btn.onmouseleave = () => (btn.style.opacity = '1');
  btn.addEventListener('click', async () => {
    let username = getUsername();
    if (!username) {
      const saved = await chrome.storage.local.get('chesskitSavedUsername');
      username = saved.chesskitSavedUsername || '';
    }
    if (!username) {
      alert('Chesskit Analyzer: Could not detect your username. Set it by clicking the extension icon.');
      return;
    }
    await chrome.storage.local.set({
      chesskitAutoLoad: true,
      chesskitUsername: username,
      chesskitTimestamp: Date.now(),
    });
    window.open('https://chesskit.org', '_blank');
  });
  return btn;
}

// ── MODAL CENTRAL ─────────────────────────────────────────────────────────
function injectModalButton() {
  if (document.getElementById(BUTTON_ID)) return;

  // Selector estable detectado via DevTools
  const shellButtons = document.querySelector('[data-cy="game-over-modal-shell-buttons"]');
  if (shellButtons) {
    // Reemplazar el botón Game Review con el nuestro
    const gameReviewBtn = shellButtons.querySelector('[data-cy="game-over-modal-game-review-button"]');
    if (gameReviewBtn) {
      gameReviewBtn.replaceWith(makeButton(BUTTON_ID));
      console.log('[Chesskit] ✅ Botón reemplaza Game Review en modal central');
      return;
    }
    // Si no hay Game Review, insertar al principio
    shellButtons.prepend(makeButton(BUTTON_ID));
    console.log('[Chesskit] ✅ Botón inyectado en modal central');
    return;
  }

  // Fallback: buscar por texto del modal
  const triggerWords = ['Has Ganado', 'You Won', 'Has Perdido', 'You Lost'];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    if (['SCRIPT','STYLE','SVG','PATH'].includes(node.tagName)) continue;
    const ownText = [...node.childNodes]
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim()).join('');
    for (const word of triggerWords) {
      if (ownText.includes(word)) {
        let candidate = node;
        for (let i = 0; i < 8; i++) {
          if (!candidate.parentElement) break;
          candidate = candidate.parentElement;
          const rect = candidate.getBoundingClientRect();
          if (rect.width > 200 && rect.height > 200) {
            const btns = candidate.querySelectorAll('button, [role="button"], a[href*="review"]');
            for (const b of btns) {
              const txt = b.textContent.trim();
              if (txt.includes('Review') || txt.includes('Revisión')) {
                b.replaceWith(makeButton(BUTTON_ID));
                console.log('[Chesskit] ✅ Botón reemplaza Review (fallback)');
                return;
              }
            }
          }
        }
      }
    }
  }
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────
function injectSidebarButton() {
  if (document.getElementById(BUTTON_ID_SIDEBAR)) return;

  // Buscar el botón Game Review en el sidebar (fuera del modal)
  const allReviewBtns = document.querySelectorAll('a[href*="review"], button, [role="button"]');
  for (const btn of allReviewBtns) {
    const txt = btn.textContent.trim();
    if ((txt.includes('Game Review') || txt.includes('Revisión')) && !btn.closest('[data-cy="game-over-modal-shell-buttons"]')) {
      const clone = makeButton(BUTTON_ID_SIDEBAR);
      btn.replaceWith(clone);
      console.log('[Chesskit] ✅ Botón reemplaza Game Review en sidebar');
      return;
    }
  }
}

// ── OBSERVER ──────────────────────────────────────────────────────────────
let lastCheck = 0;
const observer = new MutationObserver(() => {
  const now = Date.now();
  if (now - lastCheck < 300) return;
  lastCheck = now;
  injectModalButton();
  injectSidebarButton();
});

observer.observe(document.body, { childList: true, subtree: true });
setTimeout(() => { injectModalButton(); injectSidebarButton(); }, 1000);
