(() => {
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files/';
  let config = null;
  let tokenClient = null;
  let accessToken = '';
  let accessTokenExpiresAt = 0;
  let librariesPromise = null;
  let pickerReady = false;

  function configure(nextConfig) {
    config = nextConfig;
    tokenClient = null;
    accessToken = '';
    accessTokenExpiresAt = 0;
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

  function warmup() {
    if (librariesPromise) return librariesPromise;
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
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);
      const picker = new window.google.picker.PickerBuilder()
        .setAppId(config.projectNumber)
        .setDeveloperKey(config.apiKey)
        .setOAuthToken(accessToken)
        .setOrigin(window.location.origin)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .addView(view)
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) resolve(data.docs || []);
          else if (data.action === window.google.picker.Action.CANCEL) resolve([]);
        })
        .build();
      onStatus('Escolha uma ROM. Para PS1 em CUE, selecione também todos os arquivos BIN citados pelo CUE.');
      picker.setVisible(true);
    } catch (error) {
      reject(error);
    }
  }

  function pickFiles(onStatus = () => {}) {
    if (!config?.clientId || !config?.apiKey || !/^\d+$/.test(config?.projectNumber || '')) {
      return Promise.reject(new Error('Configure o Client ID, a chave da API e o número do projeto Google Cloud.'));
    }
    if (!pickerReady || !window.google?.accounts?.oauth2) {
      return Promise.reject(new Error('As bibliotecas do Google ainda estão carregando. Toque novamente em “Escolher no Google Drive” daqui a pouco.'));
    }
    return new Promise((resolve, reject) => {
      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: config.clientId,
          scope: DRIVE_SCOPE,
          callback: (response) => {
            if (response.error) return reject(new Error(`Falha na autorização do Google: ${response.error_description || response.error}`));
            accessToken = response.access_token;
            accessTokenExpiresAt = Date.now() + Math.max(0, Number(response.expires_in || 3600) - 60) * 1000;
            showPicker(resolve, reject, onStatus);
          },
          error_callback: (error) => reject(new Error(`A janela de autorização do Google foi bloqueada ou cancelada: ${error?.message || error?.type || 'tente novamente'}`)),
        });
      }
      onStatus('Conectando à sua conta Google…');
      tokenClient.requestAccessToken({ prompt: accessToken && Date.now() < accessTokenExpiresAt ? '' : 'consent' });
    });
  }

  async function readFile(doc) {
    if (!accessToken) throw new Error('Conecte-se novamente ao Google Drive para ler esse arquivo.');
    const url = `${DRIVE_FILES_URL}${encodeURIComponent(doc.id)}?alt=media&supportsAllDrives=true`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (response.status === 401) {
      accessToken = '';
      accessTokenExpiresAt = 0;
      throw new Error('A autorização do Google expirou. Toque novamente em “Escolher no Google Drive” e autorize a conta.');
    }
    if (response.status === 403) throw new Error(`O Google Drive não permitiu ler “${doc.name}”. Confira o acesso e se o download é permitido para esse arquivo.`);
    if (!response.ok) throw new Error(`Falha ao ler “${doc.name}” no Google Drive (HTTP ${response.status}).`);
    const blob = await response.blob();
    if (!blob.size) throw new Error(`“${doc.name}” está vazio ou o Drive não retornou seu conteúdo.`);
    return new File([blob], doc.name, { type: doc.mimeType || blob.type || 'application/octet-stream', lastModified: Date.now() });
  }

  function disconnect() {
    accessToken = '';
    accessTokenExpiresAt = 0;
    tokenClient = null;
  }

  window.RetroGoogleDrive = { configure, warmup, pickFiles, readFile, disconnect };
})();