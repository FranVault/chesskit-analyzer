# ♟ Chesskit Analyzer — Chrome Extension

> Finish a game on Chess.com. Click one button. Your game is already open in Chesskit, analyzed and ready.

![License](https://img.shields.io/badge/license-MIT-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![Chess.com](https://img.shields.io/badge/works%20with-Chess.com-brightgreen)

---

## The problem

Chess.com only lets you do a full game review **once per day** (free tier). So most players use [Chesskit.org](https://chesskit.org) — a free, unlimited analysis tool powered by Stockfish 17.

The problem? After every game you have to:
1. Open a new tab
2. Go to chesskit.org
3. Click "Load Game"
4. Type your username
5. Wait for games to load
6. Click your latest game

That's 6 steps and ~30 seconds of friction, every single game.

## The solution

This extension adds a single **"Analyze in Chesskit"** button to the Chess.com end-of-game modal. One click later, Chesskit is open with your username filled in and the latest game already selected.

---

## Demo

```
Chess.com result modal           Chesskit (auto-loaded)
┌──────────────────────┐        ┌───────────────────────────┐
│  🏆 You Won!!       │         │  Load a game              │
│                      │  ───►  │  Username: FranVault ✓    │
│  [Game Review]       │        │  > FranVault vs tfaruque  │
│  [New] [Rematch]     │        │    ● Selected             │
│  [♟ Analyze in      │        └───────────────────────────┘
│    Chesskit]  ◄───── │
└──────────────────────┘
```

---

## Installation

1. Download the latest `chesskit-extension.zip` from [Releases](../../releases)
2. Unzip the file
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** → select the unzipped folder
6. Play a game on Chess.com — the blue button appears when it ends ✓

> **Optional:** Click the extension icon in Chrome's toolbar to manually set your username (useful as a fallback).

---

## How it works

**`content_chess.js`** runs on `chess.com` and:
- Watches for the end-of-game modal using a `MutationObserver`
- Detects it by looking for text like "¡Has Ganado!" / "You Won!" — no fragile CSS class selectors
- Reads your username from `[data-test-element="user-tagline-username"]` inside `#board-layout-player-bottom`
- Injects the blue button and stores your username in `chrome.storage.local`

**`content_chesskit.js`** runs on `chesskit.org` and:
- Reads the stored username from `chrome.storage.local`
- Clicks the "Load Game" button automatically
- Types your username into the input field using React-compatible events
- Clicks the autocomplete suggestion
- Waits for `li[data-sentry-component="GameItem"]` elements to appear
- Clicks the first one (most recent game)

---

## File structure

```
chesskit-extension/
├── manifest.json          # Chrome Extension Manifest v3
├── content_chess.js       # Injected on chess.com
├── content_chesskit.js    # Injected on chesskit.org
├── popup.html             # Extension popup (username config)
├── popup.js               # Popup logic
└── icon.png               # Extension icon
```

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save your Chess.com username locally |
| `tabs` | Open Chesskit in a new tab |

No network requests. No external APIs. No tracking.

---

## Contributing

PRs welcome. The most likely things to break:

- Chess.com changes their DOM structure → update selectors in `content_chess.js`
- Chesskit changes their component names → update `content_chesskit.js`

If something breaks, open an issue with a screenshot of the DevTools Elements panel on the affected element.

---

## License

MIT — do whatever you want with it.

---

*Not affiliated with Chess.com or Chesskit.org.*
