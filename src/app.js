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
let ps1BiosUrl = '';
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
    const archive = await createZipFile(candidate.files, candidate.title);
    if (sequence !== selectionSequence) return;
    ps1DiscChooser.hidden = true;
    await prepareGame(archive, systems.find((system) => system.id === 'ps1'), candidate.title, sequence);
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

async function prepareGame(file, system, title, sequence) {
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
  pendingGame = { file, system, title };
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
    await startGame(game.file, game.system, game.title);
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

async function startGame(file, system, title = file.name) {
  player.hidden = false;
  player.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelector('#player-title').textContent = title;
  const status = document.querySelector('#player-status');
  const mount = document.querySelector('#game-screen');
  mount.replaceChildren();
  status.textContent = `Lendo ROM local (${formatBytes(file.size)})…`;
  const gameId = await stableGameId(file, system.id);
  // EmulatorJS's own demo accepts File objects directly. Keep the original filename
  // for disc-based cores that infer the image format from its extension.
  const gameUrl = system.id === 'ps1' ? file : URL.createObjectURL(file);
  running = true;
  const gamepadIndexFix = system.id === 'ps1' ? installGamepadIndexCompatibility() : false;

  Object.assign(window, {
    EJS_player: '#game-screen',
    EJS_core: system.core,
    EJS_biosUrl: system.id === 'ps1' ? ps1BiosUrl : '',
    EJS_gameUrl: gameUrl,
    EJS_gameName: title,
    EJS_gameID: gameId,
    EJS_pathtodata: EJS_DATA,
    EJS_startOnLoaded: true,
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
      gamepad: true,
      saveSavFiles: true,
      loadSavFiles: true,
    },
    EJS_ready: () => { status.textContent = `EmulatorJS ${EJS_VERSION} inicializado (${coreNames[system.core]}).`; },
    EJS_onGameStart: () => {
      status.textContent = `${coreNames[system.core]} em execução · autosave local habilitado${gamepadIndexFix ? ' · gamepad compatível ativo' : ''}`;
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

window.addEventListener('error', (event) => reportRuntimeFailure(event.message || 'erro de execução'));
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  reportRuntimeFailure(reason instanceof Error ? reason.message : String(reason || 'falha assíncrona'));
});

document.addEventListener('visibilitychange', handleEmulatorVisibility);
window.addEventListener('pageshow', handleEmulatorVisibility);
window.addEventListener('orientationchange', () => window.setTimeout(resizeEmulatorViewport, 250));
window.visualViewport?.addEventListener('resize', () => window.requestAnimationFrame(resizeEmulatorViewport));

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
