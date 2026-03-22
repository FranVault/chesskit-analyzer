const input  = document.getElementById('username');
const btn    = document.getElementById('save');
const status = document.getElementById('status');

// Cargar el usuario guardado al abrir el popup
chrome.storage.local.get('chesskitSavedUsername', (r) => {
  if (r.chesskitSavedUsername) {
    input.value = r.chesskitSavedUsername;
    status.textContent = '✓ Usuario guardado';
    status.className = 'ok';
  }
});

btn.addEventListener('click', () => {
  const val = input.value.trim();
  if (!val) {
    status.textContent = 'Ingresá tu nombre de usuario';
    status.className = 'err';
    return;
  }
  chrome.storage.local.set({ chesskitSavedUsername: val }, () => {
    status.textContent = '✓ Guardado correctamente';
    status.className = 'ok';
  });
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btn.click();
});
