const input  = document.getElementById('username');
const btn    = document.getElementById('save');
const status = document.getElementById('status');

chrome.storage.local.get('chesskitSavedUsername', (r) => {
  if (r.chesskitSavedUsername) {
    input.value = r.chesskitSavedUsername;
    status.textContent = '✓ Username saved';
    status.className = 'ok';
  }
});

btn.addEventListener('click', () => {
  const val = input.value.trim();
  if (!val) {
    status.textContent = 'Please enter your username';
    status.className = 'err';
    return;
  }
  chrome.storage.local.set({ chesskitSavedUsername: val }, () => {
    status.textContent = '✓ Saved successfully';
    status.className = 'ok';
  });
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btn.click();
});
