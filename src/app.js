const systems = [
  { id: 'gb', name: 'Game Boy Color', short: 'GBC', year: '1998', color: 'mint', extensions: ['.gb', '.gbc'], core: 'gb', active: true },
  { id: 'gba', name: 'Game Boy Advance', short: 'GBA', year: '2001', color: 'amber', extensions: ['.gba'], core: 'gba', active: true },
  { id: 'n64', name: 'Nintendo 64', short: 'N64', year: '1996', color: 'blue', extensions: ['.n64', '.z64', '.v64'] },
  { id: 'ps1', name: 'PlayStation', short: 'PS1', year: '1994', color: 'violet', extensions: ['.chd', '.pbp', '.iso', '.cue', '.bin', '.m3u'], core: 'psx', active: true },
  { id: 'dc', name: 'Dreamcast', short: 'DC', year: '1998', color: 'orange', extensions: ['.iso', '.bin', '.cdi', '.gdi', '.chd'] },
  { id: 'psp', name: 'PlayStation Portable', short: 'PSP', year: '2004', color: 'pink', extensions: ['.iso', '.cso', '.pbp', '.chd'] },
];

const EJS_VERSION = '4.2.3';
const EJS_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;
const grid = document.querySelector('#console-grid');
const fileInput = document.querySelector('#game-file');
const notice = document.querySelector('#notice');
const player = document.querySelector('#player-section');
const gamepadStatus = document.querySelector('#gamepad-status');
const fullscreenButton = document.querySelector('#toggle-fullscreen');
const biosInput = document.querySelector('#ps1-bios-file');
const biosStatus = document.querySelector('#ps1-bios-status');
let running = false;
let pendingGame = null;
let selectionSequence = 0;
let ps1BiosUrl = '';
const coreNames = { gb: 'Gambatte', gba: 'mGBA', psx: 'PCSX-ReARMed' };

grid.innerHTML = systems.map((system, index) => `
  <article class="console-card ${system.color} ${system.active ? 'console-active' : ''}">
    <div class="card-top"><span class="card-number">0${index + 1}</span><span class="card-year">${system.year}</span></div>
    <div class="console-glyph glyph-${system.id}" aria-hidden="true"><span></span></div>
    <div class="card-bottom"><div><h3>${system.name}</h3><span class="card-status">${system.active ? 'EXPERIMENTAL · TESTE LOCAL' : 'PLANEJADO'}</span></div><span class="card-arrow">${system.active ? '●' : '↗'}</span></div>
  </article>`).join('');

biosInput.addEventListener('change', async () => {
  const file = biosInput.files?.[0];
  biosInput.value = '';
  if (!file) return;
  if (!file.size) {
    biosStatus.textContent = 'Esse arquivo está vazio; escolha uma BIOS válida.';
    return;
  }
  try {
    const sample = await file.slice(0, Math.min(file.size, 4096)).arrayBuffer();
    if (!sample.byteLength) throw new Error('não foi possível ler o arquivo');
    if (ps1BiosUrl) URL.revokeObjectURL(ps1BiosUrl);
    ps1BiosUrl = URL.createObjectURL(file);
    biosStatus.textContent = `BIOS selecionada: ${file.name} · ${formatBytes(file.size)} (local)`;
  } catch (error) {
    biosStatus.textContent = error instanceof Error ? `Falha ao ler a BIOS: ${error.message}` : 'Falha ao ler a BIOS selecionada.';
  }
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const sequence = ++selectionSequence;
  fileInput.value = '';
  const extension = `.${file.name.split('.').pop().toLowerCase()}`;
  const matches = systems.filter((system) => system.extensions.includes(extension));
  const activeMatches = matches.filter((item) => item.active);
  const system = activeMatches.length === 1 ? activeMatches[0] : matches.length === 1 ? matches[0] : null;

  document.querySelector('#selected-name').textContent = file.name;
  document.querySelector('#selected-meta').textContent = `${formatBytes(file.size)} · arquivo permanece neste dispositivo`;
  document.querySelector('#selected-system').textContent = system?.short ?? (matches.length ? 'FORMATO COMPARTILHADO' : 'FORMATO A CONFERIR');
  pendingGame = null;
  const startButton = document.querySelector('#start-game');
  startButton.disabled = true;
  document.querySelector('#selection-message').textContent = system?.active
    ? 'Arquivo recebido. Verificando se o navegador consegue ler a ROM…'
    : 'Este formato ainda não pode ser iniciado nesta fase.';
  document.querySelector('#start-hint').textContent = system?.active
    ? `Arquivo selecionado. Lendo uma amostra local de ${file.name}…`
    : 'Escolha uma ROM GBC/GBA ou imagem única de PS1 (.chd, .pbp, .iso) para habilitar Iniciar jogo.';
  notice.hidden = false;

  document.querySelector('#ps1-firmware').hidden = system?.id !== 'ps1';

  if (system?.id === 'ps1' && ['.cue', '.bin', '.m3u'].includes(extension)) {
    document.querySelector('#selection-message').textContent = 'Esse formato precisa de outros arquivos do mesmo disco, que ainda não podem ser enviados juntos nesta versão.';
    document.querySelector('#start-hint').textContent = 'Para PS1, use um arquivo único .chd, .pbp ou .iso. CUE/BIN e M3U multidisco ficam para a próxima etapa.';
    notice.textContent = 'Seleção recebida, mas CUE/BIN e M3U dependem de arquivos companheiros. Converta o disco para CHD ou escolha um PBP/ISO próprio.';
    return;
  }

  if (!system?.active) {
    notice.textContent = system
      ? `${system.name} está no plano, mas seu núcleo ainda não foi integrado. Nenhum jogo será iniciado.`
      : 'Não foi possível identificar um console compatível sem ambiguidade. Formatos de disco compartilhados serão tratados nas etapas seguintes.';
    return;
  }

  const sampleBytes = Math.min(file.size, 4096);
  try {
    if (!file.size) throw new Error('o arquivo está vazio');
    const sample = await file.slice(0, sampleBytes).arrayBuffer();
    if (!sample.byteLength) throw new Error('não foi possível ler os dados do arquivo');
  } catch (error) {
    if (sequence !== selectionSequence) return;
    const detail = error instanceof Error ? error.message : 'erro de leitura';
    document.querySelector('#selection-message').textContent = `Falha ao ler o arquivo: ${detail}.`;
    document.querySelector('#start-hint').textContent = 'O navegador não conseguiu ler essa ROM. Tente selecioná-la novamente.';
    notice.textContent = 'A ROM foi selecionada, mas o navegador não conseguiu ler seu conteúdo. O arquivo continua no dispositivo.';
    return;
  }
  if (sequence !== selectionSequence) return;

  if (running) {
    document.querySelector('#selection-message').textContent = 'Encerre a sessão atual antes de iniciar outro jogo.';
    document.querySelector('#start-hint').textContent = 'Uma sessão já está aberta; recarregue a página antes de iniciar outro jogo.';
    notice.textContent = 'Já existe um jogo aberto. Encerre a sessão atual antes de iniciar outro.';
  } else {
    pendingGame = { file, system };
    startButton.disabled = false;
    document.querySelector('#selection-message').textContent = `Leitura local confirmada (${formatBytes(sampleBytes)}). Pressione “Iniciar jogo”.`;
    document.querySelector('#start-hint').textContent = `Pronto para iniciar: ${file.name}`;
    notice.textContent = 'ROM lida localmente e pronta. O arquivo não foi enviado.';
  }
});

document.querySelector('#start-game').addEventListener('click', async () => {
  if (!pendingGame || running) return;
  const game = pendingGame;
  pendingGame = null;
  document.querySelector('#start-game').disabled = true;
  notice.hidden = true;
  document.querySelector('#start-hint').textContent = 'Preparando a ROM e iniciando o núcleo…';
  try {
    await startGame(game.file, game.system);
  } catch (error) {
    running = false;
    const message = error instanceof Error ? error.message : String(error);
    document.querySelector('#player-status').textContent = `Não foi possível preparar este arquivo: ${message}`;
    document.querySelector('#start-hint').textContent = 'Falha ao preparar a ROM. Escolha o arquivo novamente e tente outra vez.';
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
  // EmulatorJS's own demo accepts File objects directly. Keep the original filename
  // for disc-based cores that infer the image format from its extension.
  const gameUrl = system.id === 'ps1' ? file : URL.createObjectURL(file);
  running = true;

  Object.assign(window, {
    EJS_player: '#game-screen',
    EJS_core: system.core,
    EJS_biosUrl: system.id === 'ps1' ? ps1BiosUrl : '',
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
    EJS_ready: () => { status.textContent = `EmulatorJS ${EJS_VERSION} inicializado (${coreNames[system.core]}).`; },
    EJS_onGameStart: () => { status.textContent = `${coreNames[system.core]} em execução · autosave local habilitado`; },
  });

  const script = document.createElement('script');
  script.src = `${EJS_DATA}loader.js`;
  script.async = true;
  script.onload = () => { status.textContent = 'Carregando o núcleo e preparando o jogo…'; };
  script.onerror = () => {
    status.textContent = 'Não foi possível carregar o núcleo. Verifique a conexão e recarregue a página.';
    running = false;
    if (typeof gameUrl === 'string' && gameUrl.startsWith('blob:')) URL.revokeObjectURL(gameUrl);
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

const reloadPage = () => window.location.reload();
document.querySelector('#reload-page').addEventListener('click', reloadPage);
document.querySelector('#reload-session').addEventListener('click', reloadPage);

fullscreenButton.addEventListener('click', () => {
  if (document.body.classList.contains('game-fullscreen')) {
    void exitGameFullscreen();
  } else {
    void enterGameFullscreen();
  }
});

async function enterGameFullscreen() {
  document.body.classList.add('game-fullscreen');
  fullscreenButton.textContent = 'SAIR DA TELA CHEIA';
  fullscreenButton.setAttribute('aria-pressed', 'true');
  if (player.requestFullscreen) {
    try { await player.requestFullscreen(); } catch { /* CSS viewport mode remains available, including on iPhone. */ }
  }
}

async function exitGameFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen(); } catch { /* The visible exit button still clears the CSS mode. */ }
  }
  document.body.classList.remove('game-fullscreen');
  fullscreenButton.textContent = 'TELA CHEIA';
  fullscreenButton.setAttribute('aria-pressed', 'false');
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('game-fullscreen')) {
    document.body.classList.remove('game-fullscreen');
    fullscreenButton.textContent = 'TELA CHEIA';
    fullscreenButton.setAttribute('aria-pressed', 'false');
  }
});

const aboutDialog = document.querySelector('#about-dialog');
document.querySelector('#about-button').addEventListener('click', () => aboutDialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => aboutDialog.close());

function inspectGamepads() {
  if (!navigator.getGamepads) {
    gamepadStatus.textContent = 'Este navegador não oferece Gamepad API nesta página.';
    return;
  }
  const connected = [...navigator.getGamepads()].filter((pad) => pad?.connected);
  if (!connected.length) {
    gamepadStatus.textContent = 'Nenhum gamepad detectado. Conecte/pareie o controle e tente novamente.';
    return;
  }
  gamepadStatus.textContent = connected.map((pad, index) => {
    const pressed = [...pad.buttons].filter((button) => button.pressed).length;
    return `${pad.id || `Gamepad ${index + 1}`} · ${pad.buttons.length} botões · ${pad.axes.length} eixos · ${pressed} pressionados`;
  }).join(' | ');
}

document.querySelector('#gamepad-refresh').addEventListener('click', inspectGamepads);
window.addEventListener('gamepadconnected', inspectGamepads);
window.addEventListener('gamepaddisconnected', inspectGamepads);
window.setInterval(() => {
  if (!document.hidden) inspectGamepads();
}, 1000);

window.retroBrowserAppReady = true;
document.querySelector('#start-hint').textContent = location.protocol === 'file:'
  ? 'Interface carregada. Para iniciar o motor WebAssembly, abra o projeto por um servidor local (instruções no README).'
  : 'Interface carregada. Selecione uma ROM GBC ou GBA para confirmar a leitura local.';
