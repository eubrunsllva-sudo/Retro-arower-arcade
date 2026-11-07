(() => {
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files/';
  const CONFIG_URL = new URL('/api/google/config', window.location.origin);
  const TOKEN_URL = new URL('/api/google/token', window.location.origin);
  let config = null;
  let configPromise = null;
  let accessToken = '';
  let accessTokenExpiresAt = 0;
  let librariesPromise = null;
  let pickerReady = false;

  async function loadConfig() {
    if (config?.configured) return config;
    if (configPromise) return configPromise;
    configPromise = fetch(CONFIG_URL, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Não foi possível verificar a configuração Google (HTTP ${response.status}).`);
        const next = await response.json();
        config = next;
        return next;
      })
      .catch((error) => {
        configPromise = null;
        throw error;
      });
    return configPromise;
  }

  function loadScript(id, src, ready) {
    if (ready()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Não foi possível carregar as bibliotecas Google. Verifique a conexão ou bloqueador de conteúdo.'));
        document.head.append(script);
      } else {
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', () => reject(new Error('Não foi possível carregar as bibliotecas Google.')), { once: true });
      }
    });
  }

  async function warmup() {
    if (librariesPromise) return librariesPromise;
    const settings = await loadConfig();
    if (!settings.configured) throw new Error('O login do Google ainda está sendo configurado. Tente novamente depois que o administrador concluir a configuração.');
    librariesPromise = Promise.all([
      loadScript('google-gis-client', 'https://accounts.google.com/gsi/client', () => Boolean(window.google?.accounts?.oauth2)),
      loadScript('google-api-client', 'https://apis.google.com/js/api.js', () => Boolean(window.gapi)),
    ]).then(() => new Promise((resolve, reject) => {
      if (pickerReady) return resolve();
      window.gapi.load('picker', {
        callback: () => { pickerReady = true; resolve(); },
        onerror: () => reject(new Error('A biblioteca do Google Picker não carregou.')),
        timeout: 15000,
        ontimeout: () => reject(new Error('Tempo esgotado ao carregar o Google Picker.')),
      });
    })).catch((error) => {
      librariesPromise = null;
      throw error;
    });
    return librariesPromise;
  }

  function showPicker(resolve, reject, onStatus) {
    try {
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);
      const pickerWidth = Math.max(566, Math.min(1051, window.innerWidth - 24));
      const pickerHeight = Math.max(350, Math.min(650, window.innerHeight - 40));
      const picker = new window.google.picker.PickerBuilder()
        .setAppId(config.projectNumber)
        .setDeveloperKey(config.apiKey)
        .setOAuthToken(accessToken)
        .setOrigin(window.location.origin)
        .setLocale('pt-BR')
        .setSize(pickerWidth, pickerHeight)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .addView(view)
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) resolve(data.docs || []);
          else if (data.action === window.google.picker.Action.CANCEL) resolve([]);
        })
        .build();
      onStatus('Conta Google conectada. Escolha uma ROM; para PS1 em CUE, selecione também os BIN citados pelo CUE.');
      picker.setVisible(true);
    } catch (error) {
      reject(error);
    }
  }

  async function exchangeCode(code) {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XmlHttpRequest',
      },
      body: JSON.stringify({ code }),
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.access_token) {
      const message = result.description || result.error;
      throw new Error(message === 'google_oauth_not_configured'
        ? 'O login ainda não foi configurado no Cloudflare.'
        : `O Google não concluiu a autorização${message ? `: ${message}` : '.'}`);
    }
    return result;
  }

  async function pickFiles(onStatus = () => {}) {
    const settings = await loadConfig();
    if (!settings.configured) throw new Error('O login do Google ainda não está configurado neste site.');
    if (!pickerReady || !window.google?.accounts?.oauth2) {
      throw new Error('As bibliotecas do Google ainda estão carregando. Toque novamente em “Escolher ROM no Google Drive” daqui a pouco.');
    }
    return new Promise((resolve, reject) => {
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: settings.clientId,
        scope: DRIVE_SCOPE,
        ux_mode: 'popup',
        select_account: true,
        callback: async (response) => {
          if (response.error || !response.code) {
            reject(new Error(`Falha na autorização do Google: ${response.error_description || response.error || 'nenhum código de autorização recebido'}`));
            return;
          }
          try {
            onStatus('Validando a autorização com segurança…');
            const token = await exchangeCode(response.code);
            accessToken = token.access_token;
            accessTokenExpiresAt = Date.now() + Math.max(0, Number(token.expires_in || 3600) - 60) * 1000;
            showPicker(resolve, reject, onStatus);
          } catch (error) {
            reject(error);
          }
        },
        error_callback: (error) => reject(new Error(`A janela oficial do Google foi bloqueada ou fechada: ${error?.message || error?.type || 'tente novamente'}`)),
      });
      onStatus('Abrindo a janela oficial do Google…');
      codeClient.requestCode();
    });
  }

  async function readFile(doc, onProgress = () => {}) {
    if (!accessToken || Date.now() >= accessTokenExpiresAt) {
      accessToken = '';
      accessTokenExpiresAt = 0;
      throw new Error('A autorização expirou. Toque novamente em “Escolher ROM no Google Drive” e conecte a conta.');
    }
    const url = `${DRIVE_FILES_URL}${encodeURIComponent(doc.id)}?alt=media&supportsAllDrives=true`;
    // XHR keeps the response in the browser's Blob store instead of retaining
    // every streamed Uint8Array in JavaScript and then assembling another File.
    // This lowers the temporary JS-heap peak on iOS/WebKit for large PS1 images.
    // EmulatorJS still needs memory for its own core, so this cannot make a
    // large image fit on devices whose available memory is too small.
    const blob = await new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url);
      request.responseType = 'blob';
      request.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      request.onprogress = (event) => onProgress(event.loaded, event.lengthComputable ? event.total : Number(doc.sizeBytes) || 0);
      request.onerror = () => reject(new Error(`Falha de rede ao baixar “${doc.name}” do Google Drive. Verifique a conexão e tente novamente.`));
      request.onabort = () => reject(new Error(`O download de “${doc.name}” foi interrompido.`));
      request.onload = () => {
        if (request.status === 401) {
          accessToken = '';
          accessTokenExpiresAt = 0;
          reject(new Error('A autorização do Google expirou. Toque novamente em “Escolher ROM no Google Drive” e autorize a conta.'));
        } else if (request.status === 403) {
          reject(new Error(`O Google Drive não permitiu ler “${doc.name}”. Confira o acesso e se o download é permitido para esse arquivo.`));
        } else if (request.status < 200 || request.status >= 300) {
          reject(new Error(`Falha ao ler “${doc.name}” no Google Drive (HTTP ${request.status}).`));
        } else {
          resolve(request.response);
        }
      };
      request.send();
    });
    if (!blob?.size) throw new Error(`“${doc.name}” está vazio ou o Drive não retornou seu conteúdo.`);
    onProgress(blob.size, Number(doc.sizeBytes) || blob.size);
    return new File([blob], doc.name, { type: doc.mimeType || blob.type || 'application/octet-stream', lastModified: Date.now() });
  }

  function disconnect() {
    const token = accessToken;
    accessToken = '';
    accessTokenExpiresAt = 0;
    if (token && window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
  }

  window.RetroGoogleDrive = { loadConfig, warmup, pickFiles, readFile, disconnect };
})();
