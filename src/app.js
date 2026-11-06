const systems = [
  { id: 'gbc', name: 'Game Boy Color', short: 'GBC', year: '1998', color: 'mint', extensions: ['.gb', '.gbc'] },
  { id: 'gba', name: 'Game Boy Advance', short: 'GBA', year: '2001', color: 'amber', extensions: ['.gba'] },
  { id: 'n64', name: 'Nintendo 64', short: 'N64', year: '1996', color: 'blue', extensions: ['.n64', '.z64', '.v64'] },
  { id: 'ps1', name: 'PlayStation', short: 'PS1', year: '1994', color: 'violet', extensions: ['.iso', '.bin', '.cue', '.pbp', '.chd'] },
  { id: 'dc', name: 'Dreamcast', short: 'DC', year: '1998', color: 'orange', extensions: ['.iso', '.bin', '.cdi', '.gdi', '.chd'] },
  { id: 'psp', name: 'PlayStation Portable', short: 'PSP', year: '2004', color: 'pink', extensions: ['.iso', '.cso', '.pbp', '.chd'] },
];

const grid = document.querySelector('#console-grid');
const fileInput = document.querySelector('#game-file');
const notice = document.querySelector('#notice');
let chosenSystem = null;

grid.innerHTML = systems.map((system, index) => `
  <article class="console-card ${system.color}">
    <div class="card-top"><span class="card-number">0${index + 1}</span><span class="card-year">${system.year}</span></div>
    <div class="console-glyph glyph-${system.id}" aria-hidden="true"><span></span></div>
    <div class="card-bottom"><div><h3>${system.name}</h3><span class="card-status">PLANEJADO</span></div><span class="card-arrow">↗</span></div>
  </article>`).join('');

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const extension = `.${file.name.split('.').pop().toLowerCase()}`;
  const matches = systems.filter((system) => system.extensions.includes(extension));
  chosenSystem = matches.length === 1 ? matches[0] : null;

  document.querySelector('#selected-name').textContent = file.name;
  document.querySelector('#selected-meta').textContent = `${formatBytes(file.size)} · arquivo permanece neste dispositivo`;
  document.querySelector('#selected-system').textContent = chosenSystem?.short ?? (matches.length ? 'FORMATO COMPARTILHADO' : 'FORMATO A CONFERIR');
  document.querySelector('#selected-game').hidden = false;

  notice.textContent = chosenSystem
    ? `${chosenSystem.name} reconhecido pela extensão. O núcleo de emulação ainda será integrado numa próxima etapa; este arquivo ainda não pode iniciar um jogo.`
    : 'O arquivo foi selecionado. Alguns formatos servem a mais de um console ou podem ser arquivos de disco; a identificação e a compatibilidade serão refinadas nas próximas etapas.';
  notice.hidden = false;
  // Retain no ROM data in storage in this foundation milestone.
  fileInput.value = '';
});

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Tamanho desconhecido';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

const aboutDialog = document.querySelector('#about-dialog');
document.querySelector('#about-button').addEventListener('click', () => aboutDialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => aboutDialog.close());
