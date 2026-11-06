const systems = [
  { id: 'gb', name: 'Game Boy Color', short: 'GBC', year: '1998', color: 'mint', extensions: ['.gb', '.gbc'], core: 'gb', active: true },
  { id: 'gba', name: 'Game Boy Advance', short: 'GBA', year: '2001', color: 'amber', extensions: ['.gba'], core: 'gba', active: true },
  { id: 'n64', name: 'Nintendo 64', short: 'N64', year: '1996', color: 'blue', extensions: ['.n64', '.z64', '.v64'] },
  { id: 'ps1', name: 'PlayStation', short: 'PS1', year: '1994', color: 'violet', extensions: ['.iso', '.bin', '.cue', '.pbp', '.chd'] },
  { id: 'dc', name: 'Dreamcast', short: 'DC', year: '1998', color: 'orange', extensions: ['.iso', '.bin', '.cdi', '.gdi', '.chd'] },
  { id: 'psp', name: 'PlayStation Portable', short: 'PSP', year: '2004', color: 'pink', extensions: ['.iso', '.cso', '.pbp', '.chd'] },
];

const EJS_VERSION = '4.2.3';
const EJS_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;
const grid = document.querySelector('#console-grid');
const fileInput = document.querySelector('#game-file');
const notice = document.querySelector('#notice');
const player = document.querySelector('#player-section');
let running = false;
let pendingGame = null;

grid.innerHTML = systems.map((system, index) => `
  <article class="console-card ${system.color} ${system.active ? 'console-active' : ''}">
    <div class="card-top"><span class="card-number">0${index + 1}</span><span class="card-year">${system.year}</span></div>
    <div class="console-glyph glyph-${system.id}" aria-hidden="true"><span></span></div>
    <div class="card-bottom"><div><h3>${system.name}</h3><span class="card-status">${system.active ? 'EXPERIMENTAL · TESTE LOCAL' : 'PLANEJADO'}</span></div><span class="card-arrow">${system.active ? '●' : '↗'}</span></div>
  </article>`).join('');

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const extension = `.${file.name.split('.').pop().toLowerCase()}`;
  const matches = systems.filter((system) => system.extensions.includes(extension));
  const system = matches.length === 1 ? matches[0] : null;

  document.querySelector('#selected-name').textContent = file.name;
  document.querySelector('#selected-meta').textContent = `${formatBytes(file.size)} · arquivo permanece neste dispositivo`;
  document.querySelector('#selected-system').textContent = system?.short ?? (matches.length ? 'FORMATO COMPARTILHADO' : 'FORMATO A CONFERIR');
  document.querySelector('#selected-game').hidden = false;
  pendingGame = system?.active ? { file, system } : null;
  const startButton = document.querySelector('#start-game');
  startButton.disabled = !pendingGame || running;
  document.querySelector('#selection-message').textContent = pendingGame
    ? 'Arquivo pronto. Pressione “Iniciar jogo” para carregar o emulador.'
    : 'Este formato ainda não pode ser iniciado nesta fase.';
  notice.hidden = false;

  if (!system?.active) {
    notice.textContent = system
      ? `${system.name} está no plano, mas seu núcleo ainda não foi integrado. Nenhum jogo será iniciado.`
      : 'Não foi possível identificar um console compatível sem ambiguidade. Formatos de disco compartilhados serão tratados nas etapas seguintes.';
    fileInput.value = '';
    return;
  }
  if (running) {
    pendingGame = null;
    startButton.disabled = true;
    document.querySelector('#selection-message').textContent = 'Encerre a sessão atual antes de iniciar outro jogo.';
    notice.textContent = 'Já existe um jogo aberto. Encerre a sessão atual antes de iniciar outro.';
    return;
  }
  notice.textContent = 'Arquivo preparado. Confira o nome e pressione “Iniciar jogo”.';
  fileInput.value = '';
});

document.querySelector('#start-game').addEventListener('click', async () => {
  if (!pendingGame || running) return;
  const game = pendingGame;
  pendingGame = null;
  document.querySelector('#start-game').disabled = true;
  notice.hidden = true;
  try {
    await startGame(game.file, game.system);
  } catch (error) {
    running = false;
    const message = error instanceof Error ? error.message : String(error);
    document.querySelector('#player-status').textContent = `Não foi possível preparar este arquivo: ${message}`;
    notice.textContent = 'Falha ao ler a ROM. Confirme que o arquivo é uma ROM válida e tente novamente.';
    notice.hidden = false;
  }
  fileInput.value = '';
});

async function startGame(file, system) {
  player.hidden = false;
  player.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelector('#player-title').textContent = file.name;
  const status = document.querySelector('#player-status');
  const mount = document.querySelector('#game-screen');
  mount.replaceChildren();
  status.textContent = `Lendo ROM local (${formatBytes(file.size)})…`;
  const gameId = await stableGameId(file, system.id);
  const gameUrl = URL.createObjectURL(file);
  running = true;

  Object.assign(window, {
    EJS_player: '#game-screen',
    EJS_core: system.core,
    EJS_gameUrl: gameUrl,
    EJS_gameName: file.name,
    EJS_gameID: gameId,
    EJS_pathtodata: EJS_DATA,
    EJS_startOnLoaded: true,
    EJS_color: '#d6fa6a',
    EJS_fixedSaveInterval: 30000,
    EJS_Buttons: {
      playPause: true,
      restart: true,
      settings: true,
      fullscreen: true,
      saveState: true,
      loadState: true,
      gamepad: true,
      saveSavFiles: true,
      loadSavFiles: true,
    },
    EJS_ready: () => { status.textContent = 'Emulador pronto. Se o jogo aguardar, use o botão ▶ da barra.'; },
    EJS_onGameStart: () => { status.textContent = 'Jogo iniciado · autosave local habilitado'; },
  });

  const script = document.createElement('script');
  script.src = `${EJS_DATA}loader.js`;
  script.async = true;
  script.onload = () => { status.textContent = 'Carregando o núcleo e preparando o jogo…'; };
  script.onerror = () => {
    status.textContent = 'Não foi possível carregar o núcleo. Verifique a conexão e recarregue a página.';
    running = false;
    URL.revokeObjectURL(gameUrl);
  };
  document.head.append(script);
  window.setTimeout(() => {
    if (running && status.textContent.startsWith('Carregando')) {
      status.textContent = 'O núcleo ainda não respondeu. Verifique a internet, permita o carregamento da CDN e tente novamente; ROMs maiores podem levar mais tempo.';
    }
  }, 45000);
}

async function stableGameId(file, systemId) {
  // Sample both ends rather than copying a large cartridge into memory or blocking the UI.
  const sampleSize = 64 * 1024;
  const [head, tail] = await Promise.all([
    file.slice(0, Math.min(file.size, sampleSize)).arrayBuffer(),
    file.slice(Math.max(0, file.size - sampleSize)).arrayBuffer(),
  ]);
  const bytes = new Uint8Array(head.byteLength + tail.byteLength);
  bytes.set(new Uint8Array(head));
  bytes.set(new Uint8Array(tail), head.byteLength);
  const label = new TextEncoder().encode(`${systemId}:${file.name}:${file.size}`);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (const byte of label) {
    first = Math.imul(first ^ byte, 0x01000193);
    second = Math.imul(second ^ byte, 0x85ebca6b);
  }
  for (const byte of bytes) {
    first = Math.imul(first ^ byte, 0x01000193);
    second = Math.imul(second ^ byte, 0x85ebca6b);
  }
  return ((first & 0x1fffff) * 0x100000000) + (second >>> 0) || 1;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Tamanho desconhecido';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

document.querySelector('#close-player').addEventListener('click', () => {
  // A page reload lets the emulator release workers, WebGL and its object URL safely.
  window.location.reload();
});

const aboutDialog = document.querySelector('#about-dialog');
document.querySelector('#about-button').addEventListener('click', () => aboutDialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => aboutDialog.close());
