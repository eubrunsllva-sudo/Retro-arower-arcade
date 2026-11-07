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
const ps1DebugEnabled = new URLSearchParams(location.search).get('debug') === '1';
function logPs1Diagnostic(stage, details = {}) {
  if (ps1DebugEnabled) console.info(`[Retro PS1] ${stage}`, details);
}
const grid = document.querySelector('#console-grid');
const fileInput = document.querySelector('#game-file');
const folderInput = document.querySelector('#game-folder');
const notice = document.querySelector('#notice');
const player = document.querySelector('#player-section');
const gamepadStatus = document.querySelector('#gamepad-status');
const fullscreenButton = document.querySelector('#toggle-fullscreen');
const biosInput = document.querySelector('#ps1-bios-file');
const biosStatus = document.querySelector('#ps1-bios-status');
const ps1DiscChooser = document.querySelector('#ps1-disc-chooser');
const ps1DiscSelect = document.querySelector('#ps1-disc-select');
const ps1DiscStatus = document.querySelector('#ps1-disc-status');
let running = false;
let pendingGame = null;
let selectionSequence = 0;
let ps1BiosFile = null;
let activeExternalUrls = [];
let activeGameUrl = '';
let gamepadBridgeFrame = 0;
let gamepadBridgeInputs = new Map();
let activeSystemId = '';
let ps1Candidates = [];
let pendingSelectionSequence = 0;
const coreNames = { gb: 'Gambatte', gba: 'mGBA', psx: 'PCSX-ReARMed' };
// Explicit EmulatorJS defaults: each value2 is a RetroPad control name.
// This makes the PS1 core's first-player pad usable without relying on a
// previously saved controller profile in this browser.
const PS1_DEFAULT_CONTROLS = {
  0: { 0: { value: 'x', value2: 'BUTTON_2' }, 1: { value: 's', value2: 'BUTTON_4' }, 2: { value: 'v', value2: 'SELECT' }, 3: { value: 'enter', value2: 'START' },
    4: { value: 'up arrow', value2: 'DPAD_UP' }, 5: { value: 'down arrow', value2: 'DPAD_DOWN' }, 6: { value: 'left arrow', value2: 'DPAD_LEFT' }, 7: { value: 'right arrow', value2: 'DPAD_RIGHT' },
    8: { value: 'z', value2: 'BUTTON_1' }, 9: { value: 'a', value2: 'BUTTON_3' }, 10: { value: 'q', value2: 'LEFT_TOP_SHOULDER' }, 11: { value: 'e', value2: 'RIGHT_TOP_SHOULDER' },
    12: { value: 'tab', value2: 'LEFT_BOTTOM_SHOULDER' }, 13: { value: 'r', value2: 'RIGHT_BOTTOM_SHOULDER' }, 14: { value: '', value2: 'LEFT_STICK' }, 15: { value: '', value2: 'RIGHT_STICK' },
    16: { value: 'h', value2: 'LEFT_STICK_X:+1' }, 17: { value: 'f', value2: 'LEFT_STICK_X:-1' }, 18: { value: 'g', value2: 'LEFT_STICK_Y:+1' }, 19: { value: 't', value2: 'LEFT_STICK_Y:-1' },
    20: { value: 'l', value2: 'RIGHT_STICK_X:+1' }, 21: { value: 'j', value2: 'RIGHT_STICK_X:-1' }, 22: { value: 'k', value2: 'RIGHT_STICK_Y:+1' }, 23: { value: 'i', value2: 'RIGHT_STICK_Y:-1' } },
  1: {}, 2: {}, 3: {},
};
const TOUCH_LAYOUT_KEY = 'retro-arower-touch-layout-v3';
const LEGACY_TOUCH_LAYOUT_KEY = 'retro-arower-ps1-touch-v2';
const TOUCH_VISIBILITY_KEY = 'retro-arower-ps1-touch-visibility-v1';
const TOUCH_PANEL_POSITION_KEY = 'retro-arower-ps1-panel-position-v1';
const DEFAULT_TOUCH_LAYOUT = {
  mode: 'dpad',
  sizes: { dpad: 144, stick: 148 },
  controls: {
    dpad: { x: 14, y: 75 }, stick: { x: 14, y: 75 },
    l: { x: 14, y: 16 }, r: { x: 86, y: 16 }, l2: { x: 14, y: 34 }, r2: { x: 86, y: 34 },
    x: { x: 72, y: 67 }, y: { x: 82, y: 56 }, b: { x: 92, y: 67 }, a: { x: 82, y: 78 },
    select: { x: 42, y: 92 }, start: { x: 58, y: 92 },
  },
};
const TOUCH_CONTROL_IDS = ['dpad', 'stick', 'l', 'r', 'l2', 'r2', 'x', 'y', 'b', 'a', 'select', 'start'];
const DEFAULT_TOUCH_LAYOUTS = {
  portrait: JSON.parse(JSON.stringify(DEFAULT_TOUCH_LAYOUT)),
  landscape: {
    ...JSON.parse(JSON.stringify(DEFAULT_TOUCH_LAYOUT)),
    controls: {
      ...DEFAULT_TOUCH_LAYOUT.controls,
      dpad: { x: 14, y: 75 }, stick: { x: 14, y: 75 },
      l: { x: 14, y: 16 }, r: { x: 86, y: 16 }, l2: { x: 14, y: 34 }, r2: { x: 86, y: 34 },
      x: { x: 72, y: 67 }, y: { x: 82, y: 56 }, b: { x: 90, y: 67 }, a: { x: 82, y: 78 },
      select: { x: 42, y: 92 }, start: { x: 58, y: 92 },
    },
  },
};
function normalizeTouchLayout(stored = {}) {
  const controls = { ...DEFAULT_TOUCH_LAYOUT.controls };
  for (const id of TOUCH_CONTROL_IDS) {
    const position = stored.controls?.[id];
    if (Number.isFinite(position?.x)) controls[id] = { ...controls[id], x: Math.max(6, Math.min(94, position.x)) };
    if (Number.isFinite(position?.y)) controls[id] = { ...controls[id], y: Math.max(8, Math.min(92, position.y)) };
  }
  const sizes = {
    dpad: Number.isFinite(stored.sizes?.dpad) ? Math.max(88, Math.min(220, stored.sizes.dpad)) : DEFAULT_TOUCH_LAYOUT.sizes.dpad,
    stick: Number.isFinite(stored.sizes?.stick) ? Math.max(88, Math.min(220, stored.sizes.stick)) : DEFAULT_TOUCH_LAYOUT.sizes.stick,
  };
  return { mode: stored.mode === 'analog' ? 'analog' : 'dpad', sizes, controls };
}
function readTouchLayouts() {
  try {
    const stored = JSON.parse(localStorage.getItem(TOUCH_LAYOUT_KEY));
    if (stored?.portrait || stored?.landscape) {
      return {
        portrait: normalizeTouchLayout(stored.portrait),
        landscape: normalizeTouchLayout(stored.landscape),
      };
    }
    // The previous release stored one landscape layout. Preserve it there and
    // give portrait a safe, fully visible default the first time it is opened.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_TOUCH_LAYOUT_KEY));
    return {
      portrait: normalizeTouchLayout(DEFAULT_TOUCH_LAYOUTS.portrait),
      landscape: normalizeTouchLayout(legacy || DEFAULT_TOUCH_LAYOUTS.landscape),
    };
  } catch {
    return {
      portrait: normalizeTouchLayout(DEFAULT_TOUCH_LAYOUTS.portrait),
      landscape: normalizeTouchLayout(DEFAULT_TOUCH_LAYOUTS.landscape),
    };
  }
}
const touchLayouts = readTouchLayouts();
function getTouchOrientation() { return innerWidth > innerHeight ? 'landscape' : 'portrait'; }
let currentTouchOrientation = getTouchOrientation();
let touchLayout = touchLayouts[currentTouchOrientation];
let touchVisibilityPreference = (() => {
  try {
    const saved = localStorage.getItem(TOUCH_VISIBILITY_KEY);
    return ['show', 'hide'].includes(saved) ? saved : 'auto';
  } catch { return 'auto'; }
})();
let gamepadConnectedForTouch = false;
const touchEditButton = document.querySelector('#touch-edit-toggle');
const touchVisibleButton = document.querySelector('#touch-visible-toggle');
const touchStatus = document.querySelector('#touch-control-position');
const touchMode = document.querySelector('#touch-mode');
const dpadSizeInput = document.querySelector('#touch-dpad-size');
const stickSizeInput = document.querySelector('#touch-stick-size');
const emulatorMenuToggle = document.querySelector('#emulator-menu-toggle');
const touchPanelMove = document.querySelector('#touch-panel-move');
const touchPanelMinimize = document.querySelector('#touch-panel-minimize');
const touchPanelActions = document.querySelector('#touch-panel-actions');
const touchSettings = document.querySelector('#touch-control-settings');
const touchSettingsToggle = document.querySelector('#touch-settings-toggle');
['pointerdown', 'pointerup'].forEach((type) => touchSettingsToggle.addEventListener(type, (event) => event.stopPropagation()));
touchSettingsToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  if (activeSystemId !== 'ps1') {
    const mount = document.querySelector('#game-screen');
    const visible = mount.classList.contains('virtual-controls-hidden');
    touchVisibilityPreference = visible ? 'show' : 'hide';
    persistTouchVisibilityPreference();
    updatePs1TouchVisibility();
    touchSettingsToggle.textContent = visible ? 'OCULTAR CONTROLES' : 'MOSTRAR CONTROLES';
    return;
  }
  touchSettings.open = !touchSettings.open;
  if (touchSettings.open) restoreTouchPanelPosition();
  touchSettingsToggle.setAttribute('aria-expanded', String(touchSettings.open));
  document.body.classList.toggle('game-fullscreen-tools-open', touchSettings.open);
  requestAnimationFrame(resizeEmulatorViewport);
});
function restoreTouchPanelPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(TOUCH_PANEL_POSITION_KEY));
    if (saved?.left && saved?.top) {
      touchSettings.classList.add('panel-floating');
      touchSettings.style.left = saved.left; touchSettings.style.top = saved.top;
      requestAnimationFrame(keepTouchPanelOnscreen);
    }
  } catch { /* Default panel placement remains available. */ }
}
function keepTouchPanelOnscreen() {
  if (!touchSettings.open || !touchSettings.classList.contains('panel-floating')) return;
  const rect = touchSettings.getBoundingClientRect();
  const left = Math.max(8, Math.min(innerWidth - rect.width - 8, rect.left));
  const top = Math.max(8, Math.min(innerHeight - rect.height - 8, rect.top));
  touchSettings.style.left = `${left}px`; touchSettings.style.top = `${top}px`;
}
window.addEventListener('resize', keepTouchPanelOnscreen);
touchSettings.addEventListener('toggle', () => {
  if (document.body.classList.contains('game-fullscreen')) document.body.classList.toggle('game-fullscreen-tools-open', touchSettings.open);
  touchSettingsToggle.setAttribute('aria-expanded', String(touchSettings.open));
});
touchMode.value = touchLayout.mode;
dpadSizeInput.value = String(touchLayout.sizes.dpad);
stickSizeInput.value = String(touchLayout.sizes.stick);
function updateOrientationLayout() {
  const nextOrientation = getTouchOrientation();
  const mount = document.querySelector('#game-screen');
  mount.classList.toggle('touch-layout-landscape', nextOrientation === 'landscape');
  mount.classList.toggle('touch-layout-portrait', nextOrientation === 'portrait');
  if (nextOrientation === currentTouchOrientation) return;
  const sharedMode = touchLayout.mode;
  const sharedSizes = { ...touchLayout.sizes };
  currentTouchOrientation = nextOrientation;
  touchLayout = touchLayouts[nextOrientation];
  touchLayout.mode = sharedMode;
  touchLayout.sizes = sharedSizes;
  for (const layout of Object.values(touchLayouts)) {
    layout.mode = sharedMode;
    layout.sizes = { ...sharedSizes };
  }
  touchMode.value = touchLayout.mode;
  dpadSizeInput.value = String(touchLayout.sizes.dpad);
  stickSizeInput.value = String(touchLayout.sizes.stick);
  renderTouchControlMode();
  placeTouchControls();
  persistTouchLayout();
  if (activeSystemId === 'ps1') touchStatus.textContent = `Layout de ${nextOrientation === 'portrait' ? 'retrato' : 'paisagem'} carregado; este formato mantém sua própria organização.`;
}
updateOrientationLayout();
function updateTouchSizeControls() {
  document.querySelector('#touch-dpad-size-value').value = `${touchLayout.sizes.dpad} px`;
  document.querySelector('#touch-stick-size-value').value = `${touchLayout.sizes.stick} px`;
  placeTouchControls();
}
for (const [input, key] of [[dpadSizeInput, 'dpad'], [stickSizeInput, 'stick']]) {
  input.addEventListener('input', () => {
    touchLayout.sizes[key] = Number(input.value);
    for (const layout of Object.values(touchLayouts)) layout.sizes[key] = touchLayout.sizes[key];
    updateTouchSizeControls();
    persistTouchLayout();
  });
}
updateTouchSizeControls();
emulatorMenuToggle.addEventListener('click', (event) => {
  event.preventDefault(); event.stopPropagation();
  const mount = document.querySelector('#game-screen');
  const visible = mount.classList.toggle('ps1-toolbar-open');
  mount.classList.toggle('ps1-toolbar-closed', !visible);
  emulatorMenuToggle.setAttribute('aria-pressed', String(visible));
  emulatorMenuToggle.setAttribute('aria-label', visible ? 'Ocultar menu do emulador' : 'Mostrar menu do emulador');
});
['pointerdown', 'pointerup'].forEach((type) => emulatorMenuToggle.addEventListener(type, (event) => event.stopPropagation()));
touchPanelMinimize.addEventListener('click', () => { touchSettings.open = false; });
touchPanelMove.addEventListener('click', () => {
  const moving = touchSettings.classList.toggle('panel-moving');
  if (moving) {
    const rect = touchSettings.getBoundingClientRect();
    touchSettings.style.left = `${rect.left}px`; touchSettings.style.top = `${rect.top}px`;
    touchSettings.classList.add('panel-floating');
  }
  touchPanelMove.setAttribute('aria-pressed', String(moving));
  touchPanelMove.textContent = moving ? 'CONCLUIR POSIÇÃO' : 'MOVER PAINEL';
});
let panelDrag = null;
touchPanelActions.addEventListener('pointerdown', (event) => {
  if (!touchSettings.classList.contains('panel-moving') || event.target.closest('button')) return;
  event.preventDefault();
  const rect = touchSettings.getBoundingClientRect();
  panelDrag = { pointerId: event.pointerId, x: rect.left, y: rect.top, startX: event.clientX, startY: event.clientY };
  touchPanelActions.setPointerCapture?.(event.pointerId);
});
touchPanelActions.addEventListener('pointermove', (event) => {
  if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
  event.preventDefault();
  const rect = touchSettings.getBoundingClientRect();
  const left = Math.max(8, Math.min(innerWidth - rect.width - 8, panelDrag.x + event.clientX - panelDrag.startX));
  const top = Math.max(8, Math.min(innerHeight - rect.height - 8, panelDrag.y + event.clientY - panelDrag.startY));
  touchSettings.style.left = `${left}px`; touchSettings.style.top = `${top}px`;
});
const finishPanelDrag = (event) => {
  if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
  panelDrag = null;
  try { localStorage.setItem(TOUCH_PANEL_POSITION_KEY, JSON.stringify({ left: touchSettings.style.left, top: touchSettings.style.top })); } catch { /* Keep position for this session. */ }
};
touchPanelActions.addEventListener('pointerup', finishPanelDrag);
touchPanelActions.addEventListener('pointercancel', finishPanelDrag);
touchMode.addEventListener('change', () => {
  touchLayout.mode = touchMode.value === 'analog' ? 'analog' : 'dpad';
  for (const layout of Object.values(touchLayouts)) layout.mode = touchLayout.mode;
  persistTouchLayout();
  renderTouchControlMode();
});
document.querySelector('#touch-reset').addEventListener('click', () => {
  touchLayouts.portrait = normalizeTouchLayout(DEFAULT_TOUCH_LAYOUTS.portrait);
  touchLayouts.landscape = normalizeTouchLayout(DEFAULT_TOUCH_LAYOUTS.landscape);
  touchLayout = touchLayouts[currentTouchOrientation];
  touchMode.value = touchLayout.mode;
  dpadSizeInput.value = String(touchLayout.sizes.dpad);
  stickSizeInput.value = String(touchLayout.sizes.stick);
  updateTouchSizeControls();
  persistTouchLayout();
  renderTouchControlMode();
  placeTouchControls();
});
touchEditButton.addEventListener('click', () => {
  const root = document.querySelector('#ps1-touch-controls');
  if (!root) {
    touchStatus.textContent = 'Inicie um jogo PS1 para organizar os controles.';
    return;
  }
  if (root.classList.contains('controls-hidden') && !gamepadConnectedForTouch) {
    touchVisibilityPreference = 'show';
    persistTouchVisibilityPreference();
    updatePs1TouchVisibility();
  }
  const editing = !root.classList.contains('editing');
  setTouchEditMode(root, editing);
  if (editing) touchSettings.open = false;
});
function persistTouchVisibilityPreference() {
  try { localStorage.setItem(TOUCH_VISIBILITY_KEY, touchVisibilityPreference); } catch { /* Keep the setting for this session. */ }
}
function updatePs1TouchVisibility(gamepadConnected = gamepadConnectedForTouch) {
  gamepadConnectedForTouch = Boolean(gamepadConnected);
  const mount = document.querySelector('#game-screen');
  const root = document.querySelector('#ps1-touch-controls');
  const touchDevice = matchMedia('(pointer: coarse)').matches || window.innerWidth <= 760;
  const visible = !gamepadConnectedForTouch && (touchVisibilityPreference === 'show' || (touchVisibilityPreference === 'auto' && touchDevice));
  mount.classList.toggle('virtual-controls-hidden', !visible || activeSystemId === 'ps1');
  mount.classList.toggle('virtual-controls-forced-visible', visible && ['gb', 'gba'].includes(activeSystemId));
  root?.classList.toggle('controls-hidden', !visible);
  const label = visible ? 'OCULTAR CONTROLES' : 'MOSTRAR CONTROLES';
  touchVisibleButton.textContent = label;
  if (activeSystemId && activeSystemId !== 'ps1') touchSettingsToggle.textContent = label;
  if (root) {
    const floatingButton = root.querySelector('.touch-visibility-float');
    if (floatingButton) floatingButton.textContent = visible ? 'OCULTAR' : 'MOSTRAR';
  }
  if (gamepadConnectedForTouch) touchStatus.textContent = 'Gamepad detectado: controles de toque ocultos automaticamente.';
  else if (touchVisibilityPreference === 'auto' && !touchDevice) touchStatus.textContent = 'Controles ocultos no computador. Em telas sensíveis ao toque, aparecem automaticamente; você também pode alternar quando quiser.';
  else touchStatus.textContent = visible ? 'Controles de toque visíveis. Use “Ocultar controles” para liberar a tela.' : 'Controles de toque ocultos. Use “Mostrar controles” para jogar na tela.';
}
touchVisibleButton.addEventListener('click', () => {
  const root = document.querySelector('#ps1-touch-controls');
  const currentlyVisible = root ? !root.classList.contains('controls-hidden') : touchVisibilityPreference !== 'hide';
  touchVisibilityPreference = currentlyVisible ? 'hide' : 'show';
  persistTouchVisibilityPreference();
  updatePs1TouchVisibility();
});
function setTouchEditMode(root, editing) {
  root.classList.toggle('editing', editing);
  touchEditButton.textContent = editing ? 'CONCLUIR ORGANIZAÇÃO' : 'ARRASTAR CONTROLES';
  const floatingButton = root.querySelector('.touch-edit-float');
  if (floatingButton) floatingButton.textContent = editing ? 'CONCLUIR' : 'MOVER BOTÕES';
  touchStatus.textContent = editing ? 'Arraste cada botão. A posição é salva neste aparelho.' : 'Layout salvo neste aparelho.';
}
function persistTouchLayout() {
  try { localStorage.setItem(TOUCH_LAYOUT_KEY, JSON.stringify(touchLayouts)); } catch { /* Layout still works for this session. */ }
}
function renderTouchControlMode() {
  const root = document.querySelector('#ps1-touch-controls');
  if (!root) return;
  root.querySelector('[data-touch-control="dpad"]').hidden = touchLayout.mode !== 'dpad';
  root.querySelector('[data-touch-control="stick"]').hidden = touchLayout.mode !== 'analog';
}
function placeTouchControls() {
  const root = document.querySelector('#ps1-touch-controls');
  if (!root) return;
  root.style.setProperty('--touch-dpad-size', `${touchLayout.sizes.dpad}px`);
  root.style.setProperty('--touch-stick-size', `${touchLayout.sizes.stick}px`);
  for (const id of TOUCH_CONTROL_IDS) {
    const element = root.querySelector(`[data-touch-control="${id}"]`);
    if (!element) continue;
    element.style.left = `${touchLayout.controls[id].x}%`;
    element.style.top = `${touchLayout.controls[id].y}%`;
  }
}
function initializePs1TouchControls() {
  const mount = document.querySelector('#game-screen');
  mount.classList.add('ps1-touch-controls-enabled');
  mount.classList.add('ps1-toolbar-closed');
  mount.classList.remove('ps1-toolbar-open');
  emulatorMenuToggle.setAttribute('aria-pressed', 'false');
  emulatorMenuToggle.setAttribute('aria-label', 'Mostrar menu do emulador');
  let root = document.querySelector('#ps1-touch-controls');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ps1-touch-controls';
    root.className = 'ps1-touch-controls';
    root.innerHTML = `<button class="touch-edit-float" type="button">MOVER BOTÕES</button><button class="touch-visibility-float" type="button">OCULTAR</button>
      <div class="touch-dpad" data-touch-control="dpad" aria-label="Direcional digital"><i>▲</i><i>◀</i><i>●</i><i>▶</i><i>▼</i></div>
      <div class="touch-stick" data-touch-control="stick" aria-label="Direcional analógico"><span></span></div>
      <button class="touch-shoulder" data-touch-control="l" type="button">L1</button><button class="touch-shoulder" data-touch-control="r" type="button">R1</button><button class="touch-shoulder" data-touch-control="l2" type="button">L2</button><button class="touch-shoulder" data-touch-control="r2" type="button">R2</button>
      <button class="touch-face" data-touch-control="x" type="button">□</button><button class="touch-face" data-touch-control="y" type="button">△</button><button class="touch-face" data-touch-control="b" type="button">○</button><button class="touch-face" data-touch-control="a" type="button">×</button>
      <button class="touch-system" data-touch-control="select" type="button">SELECT</button><button class="touch-system" data-touch-control="start" type="button">START</button>`;
    mount.appendChild(root);
    root.addEventListener('pointerdown', (event) => handleTouchControlDown(event), true);
    root.addEventListener('pointermove', (event) => handleTouchControlMove(event));
    root.addEventListener('pointerup', (event) => handleTouchControlUp(event));
    root.addEventListener('pointercancel', (event) => handleTouchControlUp(event));
    root.addEventListener('click', (event) => event.stopPropagation());
    root.querySelector('.touch-edit-float').addEventListener('click', () => setTouchEditMode(root, !root.classList.contains('editing')));
    root.querySelector('.touch-visibility-float').addEventListener('click', () => {
      touchVisibilityPreference = root.classList.contains('controls-hidden') ? 'show' : 'hide';
      persistTouchVisibilityPreference();
      updatePs1TouchVisibility();
    });
  }
  mount.querySelector('.ejs_virtualGamepad_parent')?.setAttribute('aria-hidden', 'true');
  renderTouchControlMode();
  placeTouchControls();
  updatePs1TouchVisibility();
}
const touchPointers = new Map();
// RetroPad PS1 face mapping: Square=Y(1), Triangle=X(9), Circle=A(8), Cross=B(0).
const touchInputs = { l: 10, r: 11, l2: 12, r2: 13, x: 1, y: 9, b: 8, a: 0, select: 2, start: 3 };
function sendTouchInput(index, value) {
  try { window.EJS_emulator?.gameManager?.simulateInput(0, index, value); } catch (error) { console.warn('Falha ao encaminhar controle ao core', error); }
}
// Route standard browser gamepads directly into the core as a fallback for
// EmulatorJS profiles that detect a controller but leave Port 1 unmapped.
function isInteractiveEmulatorTarget(target) {
  return Boolean(target?.closest('button, a, input, select, textarea, [role="button"], [role="dialog"], .ejs_menu_bar, .ejs_popup_box, .ejs_settings_parent, [class*="popup"], [class*="modal"], [class*="dialog"], [class*="exit"], .ejs_virtualGamepad_open, #touch-settings-toggle, #toggle-fullscreen'));
}
function guardMobileEmulatorMenu(mount) {
  if (mount.dataset.mobileMenuGuard === 'installed') return;
  mount.dataset.mobileMenuGuard = 'installed';
  mount.addEventListener('touchstart', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (isInteractiveEmulatorTarget(target) || target?.closest('.ejs_virtualGamepad_parent')) return;
    if (event.cancelable) event.preventDefault();
  }, { passive: false });
  const guardEmptyPadZones = () => {
    for (const zone of mount.querySelectorAll('.ejs_virtualGamepad_parent, .ejs_virtualGamepad_left, .ejs_virtualGamepad_right')) {
      if (zone.dataset.touchMenuGuard === 'installed') continue;
      zone.dataset.touchMenuGuard = 'installed';
      zone.addEventListener('touchstart', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (isInteractiveEmulatorTarget(target)) return;
        if (event.cancelable) event.preventDefault();
      }, { passive: false });
    }
  };
  guardEmptyPadZones();
  new MutationObserver(guardEmptyPadZones).observe(mount, { childList: true, subtree: true });
}

function handleEmulatorExit() {
  running = false;
  if (gamepadBridgeFrame) cancelAnimationFrame(gamepadBridgeFrame);
  gamepadBridgeFrame = 0;
  releaseGamepadBridgeInputs();
  releaseGameObjectUrl();
  releaseExternalObjectUrls();
  document.querySelector('#player-status').textContent = 'Emulador encerrado.';
  if (document.body.classList.contains('game-fullscreen')) void exitGameFullscreen();
  player.hidden = true;
}

function startGamepadBridge(system) {
  if (gamepadBridgeFrame) cancelAnimationFrame(gamepadBridgeFrame);
  gamepadBridgeInputs = new Map();
  let connectedBefore = false;
  const buttonMap = [[0, 8], [1, 0], [2, 9], [3, 1], [4, 10], [5, 11], [6, 12], [7, 13], [8, 2], [9, 3], [10, 14], [11, 15]];
  const poll = () => {
    if (!running) { releaseGamepadBridgeInputs(); return; }
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    const pad = pads.find((candidate) => candidate?.connected);
    if (Boolean(pad) !== gamepadConnectedForTouch) updatePs1TouchVisibility(Boolean(pad));
    if (document.hidden || !pad) {
      releaseGamepadBridgeInputs();
      if (connectedBefore && !pad) document.querySelector('#player-status').textContent += ' · gamepad desconectado';
      connectedBefore = Boolean(pad);
      gamepadBridgeFrame = requestAnimationFrame(poll);
      return;
    }
    const desired = new Map();
    for (const [buttonIndex, inputIndex] of buttonMap) {
      const button = pad.buttons[buttonIndex];
      if (button && (button.pressed || button.value > 0.5)) desired.set(inputIndex, 1);
    }
    for (const [buttonIndex, inputIndex] of [[12, 4], [13, 5], [14, 6], [15, 7]]) {
      if (pad.buttons[buttonIndex]?.pressed) desired.set(inputIndex, 1);
    }
    if (system.id === 'ps1') {
      const x = pad.axes[0] || 0;
      const y = pad.axes[1] || 0;
      if (x < -0.25) desired.set(17, 0x7fff);
      if (x > 0.25) desired.set(16, 0x7fff);
      if (y < -0.25) desired.set(19, 0x7fff);
      if (y > 0.25) desired.set(18, 0x7fff);
    } else {
      if ((pad.axes[0] || 0) < -0.5) desired.set(6, 1);
      if ((pad.axes[0] || 0) > 0.5) desired.set(7, 1);
      if ((pad.axes[1] || 0) < -0.5) desired.set(4, 1);
      if ((pad.axes[1] || 0) > 0.5) desired.set(5, 1);
    }
    for (const [index, value] of gamepadBridgeInputs) {
      if (desired.get(index) !== value) sendTouchInput(index, 0);
    }
    for (const [index, value] of desired) {
      if (gamepadBridgeInputs.get(index) !== value) sendTouchInput(index, value);
    }
    gamepadBridgeInputs = desired;
    if (!connectedBefore) document.querySelector('#player-status').textContent += ' · gamepad roteado ao jogador 1';
    connectedBefore = true;
    gamepadBridgeFrame = requestAnimationFrame(poll);
  };
  gamepadBridgeFrame = requestAnimationFrame(poll);
}
function releaseGamepadBridgeInputs() {
  for (const index of gamepadBridgeInputs.keys()) sendTouchInput(index, 0);
  gamepadBridgeInputs.clear();
}
function setTouchDirection(control, event) {
  const rect = control.getBoundingClientRect();
  const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  if (control.dataset.touchControl === 'dpad') {
    sendTouchInput(4, y < -0.35 ? 1 : 0); sendTouchInput(5, y > 0.35 ? 1 : 0);
    sendTouchInput(6, x < -0.35 ? 1 : 0); sendTouchInput(7, x > 0.35 ? 1 : 0);
  } else {
    sendTouchInput(19, y < 0 ? Math.round(0x7fff * -y) : 0); sendTouchInput(18, y > 0 ? Math.round(0x7fff * y) : 0);
    sendTouchInput(17, x < 0 ? Math.round(0x7fff * -x) : 0); sendTouchInput(16, x > 0 ? Math.round(0x7fff * x) : 0);
    const knob = control.querySelector('span');
    knob.style.transform = `translate(${x * 32}px, ${y * 32}px)`;
  }
}
function releaseTouchControl(id) {
  if (id in touchInputs) sendTouchInput(touchInputs[id], 0);
  if (id === 'dpad') [4, 5, 6, 7].forEach((index) => sendTouchInput(index, 0));
  if (id === 'stick') [16, 17, 18, 19].forEach((index) => sendTouchInput(index, 0));
  const stick = document.querySelector('#ps1-touch-controls [data-touch-control="stick"] span');
  if (stick) stick.style.transform = '';
}
function handleTouchControlDown(event) {
  event.stopPropagation();
  const control = event.target.closest('[data-touch-control]');
  if (!control || control.hidden) return;
  event.preventDefault();
  event.stopPropagation();
  control.setPointerCapture?.(event.pointerId);
  const id = control.dataset.touchControl;
  if (control.closest('.editing')) {
    touchPointers.set(event.pointerId, { id, editing: true, control, startX: event.clientX, startY: event.clientY, x: touchLayout.controls[id].x, y: touchLayout.controls[id].y });
  } else {
    touchPointers.set(event.pointerId, { id, control, editing: false });
    if (id === 'dpad' || id === 'stick') setTouchDirection(control, event);
    else sendTouchInput(touchInputs[id], 1);
  }
}
function handleTouchControlMove(event) {
  const state = touchPointers.get(event.pointerId);
  if (!state) return;
  event.preventDefault();
  if (state.editing) {
    const rect = state.control.parentElement.getBoundingClientRect();
    const marginX = Math.max(4, controlMargin(state.control.offsetWidth, rect.width));
    const marginY = Math.max(4, controlMargin(state.control.offsetHeight, rect.height));
    const x = Math.max(marginX, Math.min(100 - marginX, state.x + (event.clientX - state.startX) / rect.width * 100));
    const y = Math.max(marginY, Math.min(100 - marginY, state.y + (event.clientY - state.startY) / rect.height * 100));
    touchLayout.controls[state.id] = { x, y };
    state.control.style.left = `${x}%`; state.control.style.top = `${y}%`;
  } else if (state.id === 'dpad' || state.id === 'stick') setTouchDirection(state.control, event);
}
function controlMargin(size, total) { return total ? size / total * 50 : 4; }
function handleTouchControlUp(event) {
  const state = touchPointers.get(event.pointerId);
  if (!state) return;
  touchPointers.delete(event.pointerId);
  if (state.editing) persistTouchLayout(); else releaseTouchControl(state.id);
}

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
    ps1BiosFile = file;
    biosStatus.textContent = `BIOS selecionada: ${file.name} · ${formatBytes(file.size)}; será disponibilizada ao core com o nome original (local).`;
  } catch (error) {
    biosStatus.textContent = error instanceof Error ? `Falha ao ler a BIOS: ${error.message}` : 'Falha ao ler a BIOS selecionada.';
  }
});

fileInput.addEventListener('change', () => handleSelectedFiles([...fileInput.files || []]));
folderInput.addEventListener('change', () => handleSelectedFiles([...folderInput.files || []]));
document.querySelector('#prepare-ps1-disc').addEventListener('click', async () => {
  const candidate = ps1Candidates[Number(ps1DiscSelect.value)];
  if (!candidate) return;
  await prepareDiscCandidate(candidate, pendingSelectionSequence);
});

async function handleSelectedFiles(files) {
  fileInput.value = '';
  folderInput.value = '';
  if (!files.length) return;
  const sequence = ++selectionSequence;
  pendingSelectionSequence = sequence;
  pendingGame = null;
  ps1DiscChooser.hidden = true;
  document.querySelector('#start-game').disabled = true;

  const extensions = files.map((file) => extensionOf(file.name));
  const hasPs1Structure = extensions.some((ext) => ['.cue', '.m3u'].includes(ext));
  if (hasPs1Structure || extensions.includes('.bin') || (files.length > 1 && files.some((file) => ['.chd', '.pbp', '.iso'].includes(extensionOf(file.name))))) {
    await preparePs1Selection(files, sequence);
    return;
  }
  if (files.length > 1) {
    showSelectionError('Escolha apenas uma ROM para GBC/GBA. Para PS1, selecione o CUE e seus arquivos companheiros juntos.');
    return;
  }

  const file = files[0];
  const extension = extensionOf(file.name);
  const matches = systems.filter((system) => system.extensions.includes(extension));
  const activeMatches = matches.filter((item) => item.active);
  const system = activeMatches.length === 1 ? activeMatches[0] : matches.length === 1 ? matches[0] : null;
  if (!system?.active) {
    showSelectionError(system
      ? `${system.name} ainda não tem um núcleo integrado.`
      : extension === '.bin'
        ? 'Um BIN sozinho não identifica as faixas do PS1. Selecione o arquivo CUE e todas as faixas BIN juntos.'
        : 'Formato não identificado. PS1 aceita CHD/PBP/ISO individuais ou CUE e suas faixas selecionados juntos.');
    return;
  }
  if (system.id === 'ps1' && ['.cue', '.bin', '.m3u'].includes(extension)) {
    showSelectionError('Para este formato, selecione o CUE/M3U e os arquivos que ele referencia no mesmo passo.');
    return;
  }
  await prepareGame(file, system, file.name, sequence);
}

async function preparePs1Selection(files, sequence) {
  const m3uFiles = files.filter((file) => extensionOf(file.name) === '.m3u');
  const cueFiles = files.filter((file) => extensionOf(file.name) === '.cue');
  const standalone = files.filter((file) => ['.chd', '.pbp', '.iso'].includes(extensionOf(file.name)));
  const entries = [...m3uFiles, ...cueFiles, ...standalone];
  if (!entries.length) {
    const rawBins = files.filter((file) => extensionOf(file.name) === '.bin');
    if (rawBins.length) {
      await prepareRawBinCandidates(rawBins, files, sequence);
      return;
    }
    showSelectionError('Nenhum CUE/M3U ou disco individual CHD/PBP/ISO foi encontrado.');
    return;
  }

  const candidates = [];
  const missing = new Set();
  const seenDiscs = new Set();
  for (const entry of entries) {
    const result = await collectDiscFiles(entry, files);
    if (sequence !== selectionSequence) return;
    if (result.files) {
      const media = result.files.filter((item) => !['.cue', '.m3u', '.sbi'].includes(extensionOf(item.file.name)));
      if (media.length && media.every((item) => seenDiscs.has(item.file))) continue;
      media.forEach((item) => seenDiscs.add(item.file));
      candidates.push({ title: titleFromName(entry.name), entry, files: result.files });
    }
    else result.missing.forEach((name) => missing.add(name));
  }
  const referencedBins = new Set();
  for (const cue of cueFiles) {
    const text = await readDiscText(cue);
    for (const match of text.matchAll(/^\s*FILE\s+(?:"([^"]+)"|([^\s]+))\s+[^\r\n]+/gim)) {
      const bin = resolveDiscReference(match[1] || match[2], cue, files);
      if (bin) referencedBins.add(bin);
    }
  }
  const orphanBins = files.filter((file) => extensionOf(file.name) === '.bin' && !referencedBins.has(file));
  if (orphanBins.length) candidates.push(...makeRawBinCandidates(orphanBins));
  if (!candidates.length) {
    const list = [...missing].slice(0, 5).join(', ');
    showSelectionError(list
      ? `Faltam arquivos citados no CUE/M3U: ${list}. Selecione o arquivo de índice e todas as faixas/discos juntos.`
      : 'Não foi possível ler as referências do CUE/M3U. Confira se os arquivos estão completos e com os nomes originais.');
    return;
  }
  if (candidates.length === 1) {
    await prepareDiscCandidate(candidates[0], sequence);
    return;
  }
  ps1Candidates = candidates;
  ps1DiscSelect.replaceChildren(...candidates.map((candidate, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = candidate.title;
    return option;
  }));
  ps1DiscChooser.hidden = false;
  document.querySelector('#ps1-firmware').hidden = false;
  document.querySelector('#selected-name').textContent = `${candidates.length} jogos PS1 encontrados`;
  document.querySelector('#selected-meta').textContent = `${files.length} arquivos selecionados · permanecem neste dispositivo`;
  document.querySelector('#selected-system').textContent = 'PS1';
  document.querySelector('#selection-message').textContent = 'Escolha o título e toque em “Preparar este jogo”.';
  document.querySelector('#start-hint').textContent = 'As faixas serão empacotadas localmente para o core; nada é enviado.';
  notice.hidden = true;
}

function makeRawBinCandidates(files) {
  const groups = new Map();
  const singles = [];
  for (const file of files) {
    const match = file.name.match(/^(.*?)(?:\s*\(\s*track\s*\d+\s*\)|\s+track\s*\d+)\.bin$/i);
    if (!match) { singles.push(file); continue; }
    const title = match[1].trim();
    if (!groups.has(title.toLowerCase())) groups.set(title.toLowerCase(), { title, files: [] });
    groups.get(title.toLowerCase()).files.push(file);
  }
  const candidates = [...groups.values()].map(({ title, files: tracks }) => ({
    title: `${title} (BIN sem CUE)`,
    files: tracks.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((file) => ({ path: file.webkitRelativePath || file.name, file })),
  }));
  candidates.push(...singles.map((file) => ({ title: `${titleFromName(file.name)} (BIN sem CUE)`, files: [{ path: file.webkitRelativePath || file.name, file }] })));
  return candidates;
}

async function prepareRawBinCandidates(bins, allFiles, sequence) {
  const candidates = makeRawBinCandidates(bins);
  if (!candidates.length) return;
  if (candidates.length === 1) {
    await prepareDiscCandidate(candidates[0], sequence);
    return;
  }
  ps1Candidates = candidates;
  ps1DiscSelect.replaceChildren(...candidates.map((candidate, index) => {
    const option = document.createElement('option'); option.value = String(index); option.textContent = candidate.title; return option;
  }));
  ps1DiscChooser.hidden = false;
  document.querySelector('#ps1-firmware').hidden = false;
  document.querySelector('#selected-name').textContent = `${candidates.length} jogos/arquivos BIN sem CUE`;
  document.querySelector('#selected-meta').textContent = `${allFiles.length} arquivos selecionados · confira se cada BIN é um disco completo`;
  document.querySelector('#selected-system').textContent = 'PS1';
  document.querySelector('#selection-message').textContent = 'Arquivos BIN sem CUE foram listados. Faixas de disco podem exigir o CUE original para funcionar corretamente.';
  document.querySelector('#start-hint').textContent = 'Selecione um BIN e toque em “Preparar este jogo”.';
  notice.hidden = true;
}

async function prepareDiscCandidate(candidate, sequence) {
  const totalSize = candidate.files.reduce((total, entry) => total + entry.file.size, 0);
  const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const mobileMemoryWarning = isAppleMobile && totalSize >= 300 * 1024 * 1024
    ? `Mídia PS1 grande (${formatBytes(totalSize)}). O iOS pode encerrar a aba por limite de memória; CHD costuma reduzir a pressão de memória.`
    : '';
  ps1DiscStatus.textContent = mobileMemoryWarning || `Preparando ${candidate.title} localmente…`;
  document.querySelector('#start-game').disabled = true;
  try {
    if (sequence !== selectionSequence) return;
    ps1DiscChooser.hidden = true;
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const needsExternalAssets = isAppleMobile && ['.cue', '.m3u'].includes(extensionOf(candidate.entry?.name || ''));
    let gameFile = candidate.entry || candidate.files[0]?.file;
    let externalFiles = {};
    if (needsExternalAssets) {
      const assets = await buildExternalDiscAssets(candidate);
      for (const [path, file] of assets) {
        if (!file.size) throw new Error(`A faixa ${file.name} está vazia.`);
        const sample = await file.slice(0, Math.min(file.size, 32)).arrayBuffer();
        if (!sample.byteLength) throw new Error(`O navegador não conseguiu ler a faixa ${file.name}.`);
      }
      externalFiles = Object.fromEntries([...assets].map(([path, file]) => [`/${path}`, file]));
      // On iOS, avoid a second full-size ZIP buffer. Desktop keeps the proven
      // bundled CUE/BIN path below; EJS_externalFiles remains the mobile path.
      gameFile = candidate.entry;
    } else if (['.chd', '.pbp', '.iso'].includes(extensionOf(candidate.entry?.name || ''))) {
      gameFile = candidate.entry;
    } else {
      gameFile = await createZipFile(candidate.files, candidate.title);
    }
    await prepareGame(gameFile, systems.find((system) => system.id === 'ps1'), candidate.title, sequence, externalFiles);
    ps1DiscStatus.textContent = mobileMemoryWarning || 'Conjunto de disco preparado localmente.';
    if (mobileMemoryWarning && pendingGame) {
      document.querySelector('#selected-meta').textContent += ` · ${mobileMemoryWarning}`;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'falha ao preparar o conjunto';
    ps1DiscStatus.textContent = message;
    showSelectionError(message);
  }
}

async function buildExternalDiscAssets(candidate) {
  const selected = candidate.files.map((entry) => entry.file);
  const assets = new Map();
  const addCue = async (cue, virtualCuePath, isMain = false) => {
    const cuePath = normalizeDiscPath(virtualCuePath);
    if (!isMain) assets.set(cuePath, cue);
    const cueText = await readDiscText(cue);
    const refs = [...cueText.matchAll(/^\s*FILE\s+(?:"([^"]+)"|([^\s]+))\s+[^\r\n]+/gim)].map((match) => match[1] || match[2]);
    const cueDir = cuePath.includes('/') ? cuePath.slice(0, cuePath.lastIndexOf('/')) : '';
    const resolvedRefs = [];
    for (const ref of refs) {
      const file = resolveDiscReference(ref, cue, selected);
      if (!file) throw new Error(`Faixa não encontrada ao montar os arquivos locais: ${ref}`);
      const virtualPath = normalizeDiscPath([cueDir, ref].filter(Boolean).join('/'));
      assets.set(virtualPath, file);
      resolvedRefs.push({ reference: ref, selectedFile: file.name, virtualPath: `/${virtualPath}`, bytes: file.size });
    }
    logPs1Diagnostic('CUE faixas resolvidas', { cue: cue.name, bytes: cue.size, tracks: resolvedRefs });
    const base = titleFromName(cue.name).toLowerCase();
    for (const sbi of selected.filter((file) => extensionOf(file.name) === '.sbi' && titleFromName(file.name).toLowerCase() === base)) {
      assets.set(normalizeDiscPath([cueDir, sbi.name].filter(Boolean).join('/')), sbi);
    }
  };

  const entryExt = extensionOf(candidate.entry?.name || '');
  if (entryExt === '.cue') {
    await addCue(candidate.entry, candidate.entry.name, true);
  } else if (entryExt === '.m3u') {
    const content = await readDiscText(candidate.entry);
    const refs = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
    for (const ref of refs) {
      const file = resolveDiscReference(ref, candidate.entry, selected);
      if (!file) throw new Error(`Disco não encontrado na lista multidisco: ${ref}`);
      if (extensionOf(file.name) === '.cue') await addCue(file, ref);
      else assets.set(normalizeDiscPath(ref), file);
    }
  }
  return assets;
}

async function prepareGame(file, system, title, sequence, externalFiles = {}) {
  document.querySelector('#selected-name').textContent = title;
  document.querySelector('#selected-meta').textContent = `${formatBytes(file.size)} · arquivos permanecem neste dispositivo`;
  document.querySelector('#selected-system').textContent = system.short;
  document.querySelector('#ps1-firmware').hidden = system.id !== 'ps1';
  document.querySelector('#selection-message').textContent = 'Arquivo recebido. Verificando leitura local…';
  document.querySelector('#start-hint').textContent = `Verificando ${title}…`;
  notice.hidden = false;
  try {
    if (!file.size) throw new Error('o arquivo está vazio');
    const sample = await file.slice(0, Math.min(file.size, 4096)).arrayBuffer();
    if (!sample.byteLength) throw new Error('não foi possível ler os dados do arquivo');
  } catch (error) {
    if (sequence !== selectionSequence) return;
    showSelectionError(`Falha ao ler o arquivo: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    return;
  }
  if (sequence !== selectionSequence) return;
  if (running) {
    showSelectionError('Encerre a sessão atual antes de iniciar outro jogo. Recarregue a página e escolha a nova ROM.');
    return;
  }
  pendingGame = { file, system, title, externalFiles };
  document.querySelector('#start-game').disabled = false;
  document.querySelector('#selection-message').textContent = 'Leitura local confirmada. Pressione “Iniciar jogo”.';
  document.querySelector('#start-hint').textContent = `Pronto para iniciar: ${title}`;
  notice.textContent = 'ROM pronta. O arquivo e as faixas continuam locais; nada foi enviado.';
}

function showSelectionError(message) {
  pendingGame = null;
  document.querySelector('#start-game').disabled = true;
  document.querySelector('#selection-message').textContent = message;
  document.querySelector('#start-hint').textContent = message;
  notice.hidden = false;
  notice.textContent = message;
}

function extensionOf(name) {
  return `.${name.split('.').pop().toLowerCase()}`;
}

function titleFromName(name) {
  return name.replace(/\.[^.]+$/, '');
}

function normalizeDiscPath(path) {
  const parts = String(path).replace(/\\/g, '/').split('/').filter((part) => part && part !== '.');
  if (parts.some((part) => part === '..')) throw new Error('Caminho interno inválido em CUE/M3U.');
  return parts.join('/');
}

function resolveDiscReference(reference, parentFile, files) {
  const ref = normalizeDiscPath(reference);
  const parentPath = normalizeDiscPath(parentFile.webkitRelativePath || parentFile.name);
  const parentParts = parentPath.split('/');
  parentParts.pop();
  const relative = normalizeDiscPath([...parentParts, ref].join('/')).toLowerCase();
  const exact = files.filter((file) => normalizeDiscPath(file.webkitRelativePath || file.name).toLowerCase() === relative);
  if (exact.length === 1) return exact[0];
  const basename = ref.split('/').pop().toLowerCase();
  const byName = files.filter((file) => file.name.toLowerCase() === basename);
  return byName.length === 1 ? byName[0] : null;
}

async function readDiscText(file) {
  const bytes = await file.arrayBuffer();
  let text = new TextDecoder('utf-8').decode(bytes);
  if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(bytes);
  return text;
}

async function collectDiscFiles(entry, selectedFiles) {
  const included = new Map();
  const missing = [];
  const add = (file) => included.set(normalizeDiscPath(file.webkitRelativePath || file.name), file);
  const addCue = async (cue) => {
    add(cue);
    const content = await readDiscText(cue);
    const refs = [...content.matchAll(/^\s*FILE\s+(?:"([^"]+)"|([^\s]+))\s+[^\r\n]+/gim)].map((match) => match[1] || match[2]);
    if (!refs.length) {
      missing.push(`${cue.name} (sem linhas FILE válidas)`);
      return;
    }
    for (const ref of refs) {
      const companion = resolveDiscReference(ref, cue, selectedFiles);
      if (companion) add(companion);
      else missing.push(ref);
    }
    const base = titleFromName(cue.name).toLowerCase();
    selectedFiles.filter((file) => extensionOf(file.name) === '.sbi' && titleFromName(file.name).toLowerCase() === base).forEach(add);
  };

  const ext = extensionOf(entry.name);
  if (ext === '.cue') {
    await addCue(entry);
  } else if (ext === '.m3u') {
    add(entry);
    const content = await readDiscText(entry);
    const refs = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
    if (!refs.length) missing.push(`${entry.name} (lista vazia)`);
    for (const ref of refs) {
      const disc = resolveDiscReference(ref, entry, selectedFiles);
      if (!disc) {
        missing.push(ref);
      } else if (extensionOf(disc.name) === '.cue') {
        await addCue(disc);
      } else if (['.chd', '.pbp', '.iso'].includes(extensionOf(disc.name))) {
        add(disc);
      } else {
        missing.push(`${ref} (formato de disco não reconhecido)`);
      }
    }
  } else {
    add(entry);
  }
  return missing.length ? { missing } : { files: [...included.entries()].map(([path, file]) => ({ path, file })) };
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

async function fileCrc32(file) {
  let crc = 0xffffffff;
  const chunkSize = 1024 * 1024;
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const bytes = new Uint8Array(await file.slice(offset, Math.min(file.size, offset + chunkSize)).arrayBuffer());
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipHeader(size, count, centralSize, centralOffset) {
  const bytes = new Uint8Array(size);
  return { bytes, view: new DataView(bytes.buffer) };
}

async function createZipFile(entries, title) {
  if (entries.length > 65535) throw new Error('Há arquivos demais para montar este conjunto PS1.');
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  let centralSize = 0;
  for (const { path, file } of entries) {
    if (file.size > 0xffffffff) throw new Error(`${file.name} excede o tamanho suportado pelo pacote local.`);
    const name = encoder.encode(path);
    const crc = await fileCrc32(file);
    const local = zipHeader(30 + name.length, 30 + name.length);
    local.view.setUint32(0, 0x04034b50, true);
    local.view.setUint16(4, 20, true); local.view.setUint16(6, 0x0800, true); local.view.setUint16(8, 0, true);
    local.view.setUint16(10, 0, true); local.view.setUint16(12, 0x0021, true);
    local.view.setUint32(14, crc, true); local.view.setUint32(18, file.size, true); local.view.setUint32(22, file.size, true);
    local.view.setUint16(26, name.length, true); local.bytes.set(name, 30);
    localParts.push(local.bytes, file);

    const central = zipHeader(46 + name.length, 46 + name.length);
    central.view.setUint32(0, 0x02014b50, true);
    central.view.setUint16(4, 20, true); central.view.setUint16(6, 20, true); central.view.setUint16(8, 0x0800, true);
    central.view.setUint16(10, 0, true); central.view.setUint16(12, 0, true); central.view.setUint16(14, 0x0021, true);
    central.view.setUint32(16, crc, true); central.view.setUint32(20, file.size, true); central.view.setUint32(24, file.size, true);
    central.view.setUint16(28, name.length, true); central.view.setUint32(42, offset, true); central.bytes.set(name, 46);
    centralParts.push(central.bytes);
    centralSize += central.bytes.length;
    offset += local.bytes.length + file.size;
    if (offset > 0xffffffff) throw new Error('O conjunto ultrapassa 4 GB e não pode ser preparado neste navegador.');
  }
  const end = zipHeader(22, 22);
  end.view.setUint32(0, 0x06054b50, true); end.view.setUint16(8, entries.length, true); end.view.setUint16(10, entries.length, true);
  end.view.setUint32(12, centralSize, true); end.view.setUint32(16, offset, true);
  return new File([...localParts, ...centralParts, end.bytes], `${title}.zip`, { type: 'application/zip' });
}

document.querySelector('#start-game').addEventListener('click', async () => {
  if (!pendingGame || running) return;
  const game = pendingGame;
  pendingGame = null;
  document.querySelector('#start-game').disabled = true;
  notice.hidden = true;
  document.querySelector('#start-hint').textContent = 'Preparando a ROM e iniciando o núcleo…';
  try {
    await startGame(game.file, game.system, game.title, game.externalFiles);
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

async function startGame(file, system, title = file.name, externalFiles = {}) {
  if (gamepadBridgeFrame) cancelAnimationFrame(gamepadBridgeFrame);
  gamepadBridgeFrame = 0;
  releaseGamepadBridgeInputs();
  player.hidden = false;
  activeSystemId = system.id;
  document.querySelector('#game-screen').classList.toggle('gameboy-touch-controls', ['gb', 'gba'].includes(system.id));
  touchSettings.hidden = system.id !== 'ps1';
  touchSettings.open = false;
  touchSettingsToggle.hidden = false;
  emulatorMenuToggle.hidden = system.id !== 'ps1';
  document.querySelector('#game-screen').classList.remove('ps1-toolbar-open');
  document.querySelector('#game-screen').classList.toggle('ps1-toolbar-closed', system.id === 'ps1');
  touchSettingsToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('game-fullscreen-tools-open');
  updatePs1TouchVisibility();
  player.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelector('#player-title').textContent = title;
  const status = document.querySelector('#player-status');
  const mount = document.querySelector('#game-screen');
  mount.replaceChildren();
  status.textContent = `Lendo ROM local (${formatBytes(file.size)})…`;
  const gameId = await stableGameId(file, system.id);
  // EmulatorJS's own demo accepts File objects directly. Keep the original filename
  // for disc-based cores that infer the image format from its extension.
  // EmulatorJS 4.2.3 expects a URL here. Passing a File directly can leave
  // PCSX-ReARMed at the RetroArch menu because the core receives a bad ROM path.
  const gameUrl = URL.createObjectURL(file);
  activeGameUrl = gameUrl;
  const runtimeExternalFiles = { ...externalFiles };
  if (system.id === 'ps1' && ps1BiosFile) runtimeExternalFiles[`/${ps1BiosFile.name}`] = ps1BiosFile;
  activeExternalUrls = Object.values(runtimeExternalFiles).map((asset) => URL.createObjectURL(asset));
  const externalFileMap = Object.fromEntries(Object.keys(runtimeExternalFiles).map((path, index) => [path, activeExternalUrls[index]]));
  logPs1Diagnostic('Arquivos que serão montados no VFS', Object.entries(runtimeExternalFiles).map(([path, asset]) => ({ path, name: asset.name, bytes: asset.size })));
  logPs1Diagnostic('ROM selecionada para o core', { name: file.name, bytes: file.size, type: file.type, urlScheme: new URL(gameUrl).protocol });
  running = true;
  const gamepadIndexFix = system.id === 'ps1' ? installGamepadIndexCompatibility() : false;

  Object.assign(window, {
    EJS_player: '#game-screen',
    EJS_core: system.core,
    ...(system.id === 'ps1' ? { EJS_DEBUG_XX: ps1DebugEnabled } : {}),
    // Blob URLs have random filenames; downloading a BIOS through biosUrl
    // therefore hides its required scph*.bin filename from PCSX-ReARMed.
    // Place the user-selected BIOS via externalFiles at its original name.
    EJS_biosUrl: '',
    EJS_gameUrl: gameUrl,
    // Preserve the real extension in the filename passed to RetroArch. For a
    // direct CUE/M3U/CHD this determines the content type; the app header uses title.
    EJS_gameName: system.id === 'ps1' ? file.name : title,
    EJS_gameID: gameId,
    EJS_pathtodata: EJS_DATA,
    ...(Object.keys(externalFileMap).length ? { EJS_externalFiles: externalFileMap } : {}),
    EJS_startOnLoaded: true,
    ...(system.id === 'ps1' ? { EJS_disableCue: false } : {}),
    EJS_color: '#d6fa6a',
    EJS_fixedSaveInterval: 30000,
    ...(system.id === 'ps1' ? { EJS_defaultControls: PS1_DEFAULT_CONTROLS } : {}),
    EJS_Buttons: {
      playPause: true,
      restart: true,
      settings: true,
      fullscreen: true,
      saveState: true,
      loadState: true,
      // Keep EmulatorJS's gamepad toolbar button available on PS1 as before;
      // the app overlay replaces only its on-screen touch controls.
      gamepad: true,
      saveSavFiles: true,
      loadSavFiles: true,
    },
    EJS_ready: () => {
      status.textContent = `EmulatorJS ${EJS_VERSION} inicializado (${coreNames[system.core]}).`;
      const emulator = window.EJS_emulator;
      if (typeof emulator?.on === 'function') emulator.on('exit', handleEmulatorExit);
      logPs1Diagnostic('EmulatorJS pronto', { core: system.core, gameName: file.name, externalPaths: Object.keys(runtimeExternalFiles) });
    },
    EJS_onGameStart: () => {
      // Keep Blob URLs alive for the entire session: EmulatorJS may still be
      // reading referenced disc tracks after its startup callback fires.
      if (system.id === 'ps1') {
        initializePs1TouchControls();
        const emulator = window.EJS_emulator;
        const path = emulator?.fileName ? `/${emulator.fileName}` : '';
        let mounted = false;
        try { mounted = Boolean(path && emulator.gameManager.FS.analyzePath(path).exists); } catch { /* Keep a clear fallback status. */ }
        const fs = emulator?.gameManager?.FS;
        const mountedAssets = Object.entries(runtimeExternalFiles).map(([assetPath, asset]) => {
          const fsPath = asset === ps1BiosFile ? `/system/${asset.name}` : (assetPath.startsWith('/') ? assetPath : `/${assetPath}`);
          try {
            const stat = fs.stat(fsPath);
            return { path: fsPath, expectedBytes: asset.size, found: true, actualBytes: stat.size };
          } catch (error) {
            return { path: fsPath, expectedBytes: asset.size, found: false, error: error?.message || String(error) };
          }
        });
        logPs1Diagnostic('Estado dos arquivos no VFS após iniciar', { gamePath: path, gameFound: mounted, assets: mountedAssets });
        status.textContent = mounted
          ? `PCSX-ReARMed abriu · arquivo presente no core: ${emulator.fileName} · jogo ainda não confirmado; se o menu continuar, a ROM não iniciou.`
          : `Core PS1 abriu, mas não confirmou a ROM (${emulator?.fileName || 'arquivo não identificado'}). Verifique o conjunto CUE/BIN.`;
      } else {
        status.textContent = `${coreNames[system.core]} em execução · autosave local habilitado`;
      }
      document.querySelector('#game-screen').appendChild(touchSettingsToggle);
      if (system.id === 'ps1') document.querySelector('#game-screen').appendChild(emulatorMenuToggle);
      touchSettingsToggle.textContent = system.id === 'ps1' ? '⚙' : (document.querySelector('#game-screen').classList.contains('virtual-controls-hidden') ? 'MOSTRAR CONTROLES' : 'OCULTAR CONTROLES');
      if (system.id === 'gb' || system.id === 'gba') guardMobileEmulatorMenu(document.querySelector('#game-screen'));
      startGamepadBridge(system);
      if (gamepadIndexFix) status.textContent += ' · gamepad compatível ativo';
      requestAnimationFrame(resizeEmulatorViewport);
    },
  });

  const script = document.createElement('script');
  script.src = `${EJS_DATA}loader.js`;
  script.async = true;
  script.onload = () => { status.textContent = 'Carregando o núcleo e preparando o jogo…'; };
  script.onerror = () => {
    status.textContent = 'Não foi possível carregar o núcleo. Verifique a conexão e recarregue a página.';
    running = false;
    releaseGameObjectUrl();
    releaseExternalObjectUrls();
  };
  document.head.append(script);
  window.setTimeout(() => {
    if (running && status.textContent.startsWith('Carregando')) {
      status.textContent = 'O núcleo ainda não respondeu. Verifique a internet, permita o carregamento da CDN e tente novamente; ROMs maiores podem levar mais tempo.';
    }
  }, 45000);
}

function releaseExternalObjectUrls() {
  activeExternalUrls.forEach((url) => URL.revokeObjectURL(url));
  activeExternalUrls = [];
}

function releaseGameObjectUrl() {
  if (activeGameUrl) URL.revokeObjectURL(activeGameUrl);
  activeGameUrl = '';
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

function installGamepadIndexCompatibility() {
  if (!navigator.getGamepads || navigator.__retroBrowserGamepadFix) return false;
  const nativeGetGamepads = navigator.getGamepads.bind(navigator);
  const normalizeIndex = (gamepad, index) => new Proxy(gamepad, {
    get(target, property) {
      if (property === 'index') return index;
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  try {
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value() {
        const active = Array.from(nativeGetGamepads()).filter((pad) => pad?.connected);
        const normalized = [null, null, null, null];
        active.slice(0, normalized.length).forEach((pad, index) => {
          normalized[index] = pad.index === index ? pad : normalizeIndex(pad, index);
        });
        return normalized;
      },
    });
    Object.defineProperty(navigator, '__retroBrowserGamepadFix', { value: true, configurable: false });
    return true;
  } catch {
    return false;
  }
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
['pointerdown', 'pointerup'].forEach((type) => fullscreenButton.addEventListener(type, (event) => event.stopPropagation()));

function resizeEmulatorViewport() {
  if (!running) return;
  // EmulatorJS listens to resize; orientation changes should resize the canvas,
  // never reload the page or discard the selected local File.
  window.dispatchEvent(new Event('resize'));
}

function handleEmulatorVisibility() {
  if (!running) return;
  const emulator = window.EJS_emulator;
  if (document.hidden) {
    document.querySelector('#player-status').textContent = 'Jogo pausado enquanto esta aba está em segundo plano. Retorne à página para continuar.';
    // EmulatorJS exposes pause/play on the running instance. iOS may still
    // suspend or kill a WebAssembly tab; this is best-effort lifecycle handling.
    try { emulator?.pause?.(true); } catch { /* The browser may already have suspended the core. */ }
    return;
  }
  try { emulator?.play?.(true); } catch { /* Some iOS WebKit sessions cannot resume the core. */ }
  requestAnimationFrame(() => requestAnimationFrame(resizeEmulatorViewport));
  window.setTimeout(() => {
    if (running) document.querySelector('#player-status').textContent = 'Jogo retomado. Se a imagem não voltar, o iOS suspendeu a sessão; recarregue e inicie novamente.';
  }, 250);
}

function reportRuntimeFailure(message) {
  if (!running || !/out of memory|allocation failed|memory access out of bounds|webassembly|webgl|context lost|abort/i.test(message)) return;
  document.querySelector('#player-status').textContent = `O núcleo parou: ${message.slice(0, 180)}. Em iPhone/iPad, arquivos PS1 grandes podem exceder a memória disponível.`;
}

window.addEventListener('error', (event) => {
  const message = event.message || 'erro de execução';
  logPs1Diagnostic('Erro JavaScript global', { message, source: event.filename, line: event.lineno, column: event.colno, stack: event.error?.stack });
  reportRuntimeFailure(message);
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason || 'falha assíncrona');
  logPs1Diagnostic('Promise rejeitada sem tratamento', { message, stack: reason?.stack });
  reportRuntimeFailure(message);
});
window.addEventListener('pagehide', () => {
  releaseGameObjectUrl();
  releaseExternalObjectUrls();
});

document.addEventListener('visibilitychange', handleEmulatorVisibility);
window.addEventListener('pageshow', handleEmulatorVisibility);
window.addEventListener('orientationchange', () => window.setTimeout(() => { updateOrientationLayout(); updatePs1TouchVisibility(); resizeEmulatorViewport(); }, 250));
window.visualViewport?.addEventListener('resize', () => window.requestAnimationFrame(resizeEmulatorViewport));
window.addEventListener('resize', () => { updateOrientationLayout(); updatePs1TouchVisibility(); });

async function enterGameFullscreen() {
  document.querySelector('#game-screen').appendChild(fullscreenButton);
  document.body.classList.add('game-fullscreen');
  fullscreenButton.textContent = 'SAIR';
  fullscreenButton.setAttribute('aria-label', 'Sair da tela cheia');
  fullscreenButton.title = 'Sair da tela cheia';
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
  document.querySelector('.player-actions').prepend(fullscreenButton);
  document.body.classList.remove('game-fullscreen-tools-open');
  fullscreenButton.textContent = 'TELA CHEIA';
  fullscreenButton.setAttribute('aria-label', 'Entrar em tela cheia');
  fullscreenButton.title = 'Entrar em tela cheia';
  fullscreenButton.setAttribute('aria-pressed', 'false');
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('game-fullscreen')) {
    document.body.classList.remove('game-fullscreen');
    document.querySelector('.player-actions').prepend(fullscreenButton);
    document.body.classList.remove('game-fullscreen-tools-open');
    fullscreenButton.textContent = 'TELA CHEIA';
    fullscreenButton.setAttribute('aria-label', 'Entrar em tela cheia');
    fullscreenButton.title = 'Entrar em tela cheia';
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
