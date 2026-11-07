# Registro de progresso

## 2026-11-07 — Navegação de pastas do Google Drive

- Causa encontrada: a configuração do Google Picker ocultava pastas (`setIncludeFolders(false)`), impedindo navegar pela estrutura do Drive e chegar a diretórios como `ROOM GAMES/ps1`.
- Correção nesta branch: pastas passam a aparecer e ser navegáveis; continuam sem poder ser escolhidas como arquivo. O Picker foi configurado para português do Brasil.
- Limitação: o Google controla o visual e a interface do Picker; ele não pode ser convertido na página completa do Drive. Depois do deploy, confirmar que as pastas aparecem e abrir uma ROM dentro de uma pasta.
- Estado: alteração de código feita; publicação e validação no site ainda pendentes.

## 2026-11-06 — Etapa 1: base web

### Feito

- Criada interface responsiva em português com estante visual para os seis consoles.
- Adicionado seletor local de arquivo e leitura de nome/tamanho/extensão, sem guardar os bytes da ROM.
- Aviso explícito de que nenhum jogo inicia ainda, evitando apresentar protótipo como emulador funcional.
- Documentados plano por etapas, privacidade inicial, caminhos de saves, limitações móveis e avaliação de candidatos de código aberto.

### Pesquisa e decisão

- EmulatorJS parece candidato abrangente para vários sistemas e possui licença GPL-3.0; ainda precisa auditoria da distribuição de cada core e testes.
- Dreamcast provavelmente requer integração separada; Flycast WASM será avaliado, não assumido como pronto.
- Firmware proprietário não será empacotado nem baixado pelo projeto. BIOS do usuário, quando necessária e legalmente obtida, poderá ser selecionada localmente.

### Falhas / limitações conhecidas

- Nenhum núcleo de emulação foi integrado. A seleção de arquivo é apenas demonstração da camada de entrada.
- A identificação por extensão é ambígua para imagens de disco e formatos compartilhados.
- Não há salvamento funcional, Google Drive, teclado/controle, instalação PWA ou cache offline nesta etapa.
- Não há matriz de teste em dispositivos reais; iOS e consoles mais exigentes continuam sem garantia de compatibilidade.
- Fonte tipográfica remota é carregada pelo Google Fonts no protótipo. Antes de deploy com foco em privacidade/offline, remover ou auto-hospedar essas fontes.

## 2026-11-06 — Etapa 2: primeiro núcleo (GBC/GBA)

### Feito

- Integrado o loader oficial EmulatorJS 4.2.3 por CDN fixada. O repositório não copia nem redistribui WASM/core.
- GBC/GB usa Gambatte (`gb`); GBA usa mGBA (`gba`). A documentação oficial informa BIOS opcional para ambos.
- ROM selecionada é lida por URL Blob local; não é enviada ao site. Apenas um jogo por sessão para evitar duas instâncias disputando WebGL/áudio.
- Ativado `EJS_fixedSaveInterval=30000`; EmulatorJS usa sistema de arquivos IndexedDB (IDBFS) para persistir SRAM local por jogo.
- Botão de encerrar recarrega a página para liberar worker, WebGL e URL temporária de forma previsível.
- Loader agora é inserido no `<head>`, seguindo o padrão oficial, e o host fica dedicado ao DOM do emulador. A interface mostra leitura da ROM, carregamento e falha por timeout.
- ID da sessão usa amostras do início/fim do arquivo e metadados em hash rápido, evitando varrer dezenas de MB no thread principal antes de abrir o core.
- Interface e avisos agora distinguem sistemas experimentais e sistemas ainda planejados.
- A partida agora exige ação clara: selecionar uma ROM mostra o resumo e habilita **Iniciar jogo**. Encerrar continua separado e não confunde a seleção do arquivo com o início.
- Correção após novo relato: **Iniciar jogo** agora fica sempre visível ao lado de **Escolher um jogo** na tela inicial, desativado até a seleção de uma ROM compatível. **Recarregar página** está disponível no início e durante a sessão.
- O nome do jogo e o sistema agora ficam logo abaixo dos botões. A seleção lê uma amostra de 4 KiB antes de habilitar Iniciar e informa que a leitura local foi confirmada; erro de arquivo vazio/leitura é mostrado na página.
- O status da sessão identifica quando o callback de prontidão do EmulatorJS 4.2.3 dispara e quando o evento de início do core dispara. Assim, a tela distingue ROM selecionada de core realmente inicializado.
- Diagnóstico da página que ficava na mensagem inicial: `index.html` carregava `app.js` como módulo. Se aberto diretamente por `file://`, o navegador bloqueia o módulo por CORS; a página estática aparece, mas nenhum evento de seleção é instalado. Alterado para script clássico `defer` (o arquivo não usa import/export), com mensagens caso o JS falhe e marcador visível quando a interface inicializa.
- Barra do EmulatorJS habilitada com pausa/retomar, reinício, configurações de controle, tela cheia, save/load state e exportação/importação de SRAM suportadas pelo motor.
- Identificador de save considera amostras dos dados e nome/tamanho, sem exigir cópia/hash completo da ROM.

### Validação desta etapa

- Revisão estática do fluxo, configuração conforme as páginas oficiais do EmulatorJS e sintaxe JavaScript serão verificadas nesta etapa.
- Não há ROM homebrew incluída e ainda não foi possível certificar execução real em cada navegador/aparelho. Por isso GBC/GBA permanecem **experimentais**, não “100% testados”.
- Falha inicial: a etapa anterior apenas identificava arquivos. Corrigido ligando a seleção ao loader e impedindo que consoles sem integração sejam apresentados como iniciáveis.
- Falha relatada no teste: não havia botão explícito de início e a tela não explicava as opções de controle. Corrigido com fluxo de seleção → iniciar e explicação dos controles na sessão.
- Esclarecimento de interface: o botão de início anterior só aparecia na seção de arquivo selecionado, abaixo da estante. Movido para a área principal do início conforme o fluxo esperado; o botão de recarga deixa explícito que será necessário reescolher a ROM.
- Captura mais recente ainda mostrava “Escolha uma ROM…” e botão desativado, então a página não havia registrado um arquivo selecionado naquela tela. Movido o recibo do arquivo para o início para expor o nome e o estado imediatamente após o evento do seletor.
- Causa compatível com o sintoma identificada: abrir o HTML por `file://` impedia a inicialização do script por ser `type="module"`, exatamente como descreve a MDN. Como a URL usada pelo usuário não estava visível na captura, essa condição ainda precisa ser confirmada no aparelho; a integração deixou de depender dela.
- Checagem de formato: `.gba` é aceito pelo seletor e mapeado ao sistema/core `gba`/mGBA; `.gb`/`.gbc` mapeados a `gb`/Gambatte. ROMs compactadas `.zip` não tinham mapeamento e foram removidas do filtro para não parecerem compatíveis nesta etapa.
- O cartão SD não muda a API de leitura: após escolher um arquivo, o navegador fornece um `File` como em qualquer outra unidade. I/O lento ou arquivo inválido ainda podem falhar; a interface agora mostra etapas e erro em vez de parecer não responder.
- Teste simulado do fluxo (nome de arquivo → leitura amostra → início → core/loader/estado/controladores/recarregar) passou. Teste com ROM real continua pendente; o navegador local não pôde ser controlado nesta sessão.
- A pasta comum do navegador não pode ser escolhida como catálogo inteiro pelo seletor HTML usado aqui; o usuário escolhe um arquivo ROM de cada vez. Não há acesso recursivo ao aparelho.

### Limitações conhecidas

- Precisa de internet para obter loader/core da CDN. A ROM permanece local, mas o código do motor é servido por terceiro.
- A barra do motor expõe save/load state e save/load SRAM; esses botões ainda precisam de teste de ponta a ponta. Drive continua fora desta etapa. Autosave depende de espaço no IndexedDB; limpar dados do navegador pode apagar progresso.
- Controles do upstream: teclado padrão configurável e gamepad Bluetooth via menu de controles; gamepad virtual pode ser ativado em tela sensível ao toque. O suporte é relatado pela documentação do EmulatorJS, mas ainda não foi verificado neste projeto em hardware real.
- Ainda sem mapeamento próprio de controles, seleção de BIOS, controle de quota ou testes em dispositivos físicos. O menu padrão do EmulatorJS fornece mapeamento; BIOS é opcional para GBC/GBA conforme a documentação consultada.
- GBC e GBA ficam experimentais até teste com homebrew legal em Chrome, Edge, Firefox, Android e iOS/Safari.

### Próximo passo

Executar homebrew de teste e validar touch, teclado/gamepad, áudio, restart, save/load SRAM/state e retomada do SRAM nos navegadores-alvo antes de declarar a fase completa.

## 2026-11-06 — Etapa 3: diagnóstico de gamepad e hospedagem

### Alterações

- Adicionado painel na interface que consulta `navigator.getGamepads()`, mostra IDs, quantidade de botões/eixos e botões pressionados; acompanha conexão e desconexão.
- Acrescentadas instruções para modo Gamepad/HID e mapeamento no EmulatorJS. O diagnóstico ajuda a separar falha de pareamento/perfil do controle de falha dentro do emulador.
- Adicionado workflow do GitHub Pages para publicar a aplicação por HTTPS a cada atualização da branch `main`.
- A ROM permanece local. A hospedagem entrega a página e os recursos do motor; a CPU/GPU do próprio dispositivo executa a emulação. Nenhuma ROM é enviada ao GitHub Pages.

### Limites e validação pendente

- O código não consegue trocar o modo Bluetooth do iPega. O navegador só recebe controle como gamepad se o firmware estiver conectado num perfil compatível; o diagnóstico é necessário para descobrir se esse é o caso.
- Ainda não houve teste físico com o modelo iPega 9023S. O suporte de gamepads em iOS varia por sistema, navegador e perfil do controle, então não é possível prometer ausência de restrições do iOS.
- GitHub Pages foi habilitado em modo de publicação por workflow; primeiro deploy do Actions concluiu com sucesso e a URL retornou HTTP 200.
- GBC/GBA/PS1 têm integração experimental; N64, Dreamcast e PSP continuam planejados.

### Resultado do deploy

- Site publicado: <https://eubrunsllva-sudo.github.io/Retro-arower-arcade/>.
- Validação observada em 2026-11-06: workflow `Publicar no GitHub Pages` concluído com sucesso; URL respondeu HTTP 200.
- Verificação local: sintaxe de `src/app.js` aprovada pelo `node --check`.
- O teste físico do iPega 9023S permanece pendente; usar o painel da página para confirmar a detecção real pelo navegador.

## 2026-11-06 — Correção do seletor no iPhone

- Causa provável: `<input type="file">` tinha `accept` com uma lista de extensões retro. O Safari do iOS tem suporte parcial/inconsistente ao filtro por extensões; o seletor pode mostrar ROMs desconhecidas em cinza sem permitir devolvê-las à página. O ícone de arquivo desconhecido no print é compatível com esse caso.
- Correção: removido o filtro `accept`; extensão e compatibilidade continuam validadas no JavaScript após a seleção. Mantida a ativação por label nativo, que já abre o seletor mostrado na captura.
- Teste real no iPhone 13 Pro pendente. Depois do deploy, recarregue a página, toque **Escolher um jogo** e toque uma vez no arquivo `.gba`; o nome deve aparecer no resumo e o botão **Iniciar jogo** deve habilitar.
- Se o app Arquivos precisar baixar o item do provedor remoto, aguarde a conclusão do download antes de selecioná-lo.
- Se tocar no item no provedor “Files from my PC” fechar/ignorar a seleção e a página continuar sem ROM, faça uma cópia em **No Meu iPhone**. Existe relato de regressão do seletor WebKit com itens de provedores externos de arquivos no iOS 26.2; essa falha pode continuar mesmo sem o filtro `accept`.

## 2026-11-06 — Modo expandido para celular

- Adicionado botão próprio **Tela cheia / Sair da tela cheia** na sessão do emulador.
- Em navegadores com Fullscreen API, o site tenta entrar em tela cheia nativa. Se essa API não existir/for recusada, ativa modo expandido com CSS, ocupando o viewport, tratando as áreas seguras do iPhone e deixando o botão de saída visível.
- iOS Safari não garante Fullscreen API para elementos comuns (há histórico de suporte restrito a vídeo); o fallback expande a página, mas a barra do navegador pode permanecer visível. Orientação paisagem deve ser feita pelo usuário.
- Validação em iPhone físico pendente; a sintaxe do JavaScript e deploy serão verificados após publicação.

## 2026-11-06 — Etapa PS1: core integrado (experimental)

### Implementado

- Ativado PS1 usando `EJS_core: 'psx'`, core padrão PCSX-ReARMed do EmulatorJS 4.2.3.
- Início direto para imagens individuais `.chd`, `.pbp` e `.iso`. Quando a extensão também pertence a um sistema ainda planejado, a seleção prioriza o único console ativo que reconhece aquele arquivo; por enquanto isso seleciona PS1.
- EJS recebe o objeto `File` original do PS1 para conservar o nome/extensão da imagem. GBC/GBA continuam usando URL Blob.
- BIOS própria opcional: o usuário escolhe o arquivo localmente e o app passa uma URL Blob ao motor. Nenhum firmware é distribuído; sem BIOS, o PCSX-ReARMed usa HLE, sujeito a limitações.
- CUE/BIN e M3U multidisco são identificados com uma explicação: esta interface ainda escolhe somente um arquivo e não carrega os companheiros requeridos.
- Atualizados cartões de console, notas de licença, README, compatibilidade e roadmap.

### Validação e limites

- Confirmei nas fontes do EmulatorJS o identificador `psx` e o core PCSX-ReARMed; documentação Libretro lista `.chd`, `.pbp` e `.iso` e informa o fallback HLE.
- Sintaxe JavaScript verificada. Não foi incluída ROM ou BIOS de terceiros. Ainda não foi possível testar uma imagem PS1 legal em execução real; PS1 permanece experimental até o usuário validar boot, controles, áudio e memory card.
- O comportamento do core e a leitura de BIOS Blob precisam validação ponta a ponta. Não assumir que selecionar BIOS equivale a uma BIOS reconhecida pelo core.
- Formatos de disco multipartes, SBI e troca de discos continuam para etapa posterior.
- Deploy do commit `a9c4f4a` concluiu com sucesso; GitHub Pages respondeu HTTP 200 e a página publicada contém o core `psx` e o seletor opcional de BIOS. A execução de jogo real continua sem teste.

## 2026-11-06 — Correção de seleção PS1 CUE/BIN e multidisco

- Causa do botão **Iniciar jogo** apagado: o seletor antigo aceitava arquivos PS1 individuais, mas não conseguia preparar as faixas BIN referenciadas por CUE nem listas M3U; o jogo ficava inelegível para início.
- Agora é possível escolher o CUE e todos os arquivos de faixa juntos, ou uma pasta (quando suportada pelo navegador). M3U pode reunir discos e seus CUE/faixas. Arquivos citados ausentes são indicados antes do início; jogos encontrados em conjunto podem ser escolhidos numa lista.
- O app constrói um ZIP temporário local, sem envio, para o núcleo reconhecer CUE/M3U e caminhos de faixa. Imagens `.chd`, `.pbp` e `.iso` individuais seguem o fluxo anterior.
- Verificado: `node --check src/app.js`. Ainda falta validar extração do pacote e inicialização/áudio/troca de disco com ROM de uso legítimo em navegadores reais; portanto PS1 continua experimental.
- Firmware proprietário não foi incluído nem baixado; BIOS própria permanece opcional, com HLE como alternativa sujeita a compatibilidade variável.

## 2026-11-06 — Descoberta completa de jogos PS1 e mapa de controle

- Corrigida a varredura de pasta: antes escolhia apenas M3U, ou CUE, ou imagens individuais; agora considera as três classes, evita duplicar discos já listados e inclui BIN sem CUE como candidatos provisórios. Faixas cujo nome termina em `Track NN` são agrupadas. BIN sem índice segue sujeito a falha de inicialização.
- O diagnóstico mostrou o controle `STANDARD GAMEPAD`, mas isso só comprova detecção pelo navegador. Pesquisa encontrou uma falha reproduzível no polling do EmulatorJS 4.2.3 quando os índices Gamepad não começam em zero. Antes de carregar o motor, o app agora compacta os gamepads conectados e normaliza os índices para o player 1.
- Adicionado `EJS_defaultControls` explícito para o jogador 1 no PS1, usando os nomes de controle recomendados na documentação do EmulatorJS. Eventual diferença do iPega deve ser remapeada em Configurações → Controles.
- Verificado: `node --check src/app.js` e `git diff --check`. Ainda não houve teste real de boot de todos os formatos nem de cada botão do iPega no jogo. Referências: FAQ/docs do EmulatorJS e issue RomM #5139 que aponta o bug upstream #1197 e correção no ramo de desenvolvimento; a versão estável aqui permanece 4.2.3.

## 2026-11-06 — Retomada móvel, rotação e falha de inicialização PS1

- Adicionada tentativa de pausar o core ao ocultar a aba e retomá-lo quando ela volta. Após rotação, dispara evento de redimensionamento para o canvas; a página não executa reload por orientação.
- Limite: iOS/WebKit pode suspender ou encerrar processo de aba. Issue upstream EmulatorJS #904 descreve congelamento após troca de app e está marcada `wontfix`; a retomada automática é melhor esforço, não garantia. Se o sistema matar a aba, o estado WASM em memória se perde. Os saves/cartão do jogo têm intervalo de flush de 30 s.
- O print mostra a página genérica de falha do navegador, sem erro do PCSX-ReARMed, então não identifica sozinho se foi rede ou encerramento por memória. Adicionado relatório visível para erros WebAssembly/WebGL/memória quando o processo ainda consegue executar JavaScript.
- Mídias PS1 grandes (>=300 MiB) em iPhone/iPad agora mostram aviso antes de empacotar; CHD pode reduzir pressão de memória. O tamanho é heurístico, sem afirmar que o navegador terá memória suficiente.
- Novo caminho móvel para CUE/M3U: abre o arquivo de índice diretamente e passa cada faixa companion como URL Blob individual via `EJS_externalFiles`; evita ler um ZIP completo em ArrayBuffer e depois manter a extração do disco em paralelo. Imagens `.chd/.pbp/.iso` também são passadas diretamente. Desktop continua com ZIP local para conjuntos multipartes.
- Verificação estática: `node --check src/app.js`, `git diff --check`. Sem teste físico no iPhone/iPad; não afirmar que o bug de suspensão foi eliminado antes desse teste.

## 2026-11-06 — Inicialização direta do PS1 e controles móveis

- Mantida a inicialização automática do conteúdo (`EJS_startOnLoaded`) após o usuário tocar em **Iniciar jogo**; o botão Configurações do EmulatorJS continua habilitado na barra para abrir o menu somente quando desejado. A documentação upstream confirma que `EJS_gameUrl` deve ser URL e que `EJS_startOnLoaded` inicia o jogo sem outro passo.
- Para PS1, a URL Blob é acompanhada pelo nome real do arquivo com extensão. Isso é necessário para o core reconhecer o tipo de CUE/M3U/CHD/PBP/ISO ao carregar conteúdo local.
- Os controles virtuais do PS1 agora têm dimensões responsivas por viewport e regra específica para paisagem baixa; D-pad, analógico ou ambos e posições individuais seguem configuráveis e salvos no navegador. O ajuste é aplicado na próxima sessão.
- Estilizado o painel de configuração de posições e removido o uso de `structuredClone` para suportar navegadores que ainda não oferecem essa API.
- Resultado estático: `node --check src/app.js`. Limite: não há ROM/BIOS disponível nesta tarefa nem acesso a iPhone físico; ainda é necessário confirmar o boot do jogo e o toque em retrato/paisagem no aparelho. Se o core continuar no menu principal, isso significa que a etapa de leitura do conteúdo ainda falhou; não classificar como jogo iniciado apenas porque o core abriu.
- Referências: [opções EmulatorJS (`EJS_startOnLoaded`, `EJS_gameUrl`, `EJS_Buttons`)](https://emulatorjs.org/docs/options/) e [mapeamento do controle virtual](https://emulatorjs.org/docs4devs/virtual-gamepad-settings/).

## Correção seguinte — PS1 e controles de toque

- A configuração anterior do controle virtual usava strings percentuais também nos botões, mas o EmulatorJS espera valores numéricos em pixels para esses botões; isso produzia sobreposição/posições inesperadas. Confirmado na documentação oficial do mapeamento virtual.
- Substituído por um controle PS1 próprio em HTML, com direcional exclusivo (D-pad ou analógico), quatro símbolos PlayStation, L1/R1, Select/Start e reposicionamento por arrasto em toda a área de jogo. A posição fica salva por navegador/aparelho e acompanha a rotação; o direcional escolhido é aplicado sem mostrar os dois juntos.
- Conjuntos CUE/M3U passam agora seus arquivos companheiros pelo `EJS_externalFiles` documentado, sem gerar o ZIP específico do projeto. `EJS_disableCue:false` também permite ao core criar um índice para alguns BIN sem CUE. O botão Configurações do EmulatorJS permanece disponível, enquanto o menu principal do RetroArch não é intencionalmente aberto como tela de configuração.
- Adicionada indicação de diagnóstico após iniciar o core: informa o caminho que ele selecionou e se a ROM aparece no sistema de arquivos interno. O menu principal do RetroArch é um sinal de que o core abriu, mas o conteúdo pode não ter sido montado ou reconhecido.
- Verificado estaticamente: `node --check src/app.js` e `git diff --check`. A ROM do usuário não está acessível neste ambiente; portanto o boot PS1 e a rotação precisam ser confirmados no iPhone. Não trocar o core apenas pelo menu: primeiro precisamos distinguir caminho ausente de conteúdo que o core rejeita. A alternativa Beetle PSX/WebRetro requer uma integração e validação separadas.
- Referências: [opções oficiais EmulatorJS](https://emulatorjs.org/docs/options/) (início automático, arquivos externos e CUE) e [layout do controle virtual](https://emulatorjs.org/docs4devs/virtual-gamepad-settings/) (unidades esperadas por tipo de botão).

## 2026-11-06 — Regressão reportada no gamepad de notebook

- PS1 estava com o botão `gamepad` da barra do EmulatorJS oculto enquanto a sobreposição própria substituía os controles de toque. A documentação do EmulatorJS classifica esse ajuste como visibilidade do botão da barra; ele não deveria desligar um gamepad físico, mas foi restaurado para PS1 também para não esconder opções de controle.
- A página orienta a diferenciar detecção do navegador (diagnóstico) de mapeamento no core (Configurações → Controles → Port 1 Controls). O navegador detectar um controle não confirma que o core o vinculou ao jogador 1.
- Adicionado identificador de versão no script da aplicação para o notebook solicitar a correção atualizada ao GitHub Pages sem reutilizar uma cópia antiga em cache.
- `node --check src/app.js` e `git diff --check` são as verificações estáticas previstas; não há gamepad físico disponível neste ambiente para confirmar a resposta em jogo. Links de referência: [opções e botões do EmulatorJS](https://emulatorjs.org/docs/options/) e [código upstream de leitura de Gamepad API](https://github.com/EmulatorJS/EmulatorJS/blob/main/data/src/gamepad.js).
- Incluído fallback de polling para controles com layout Gamepad padrão: botões, D-pad e eixos são encaminhados ao jogador 1 em GBC/GBA/PS1; os inputs ativos são liberados ao soltar, desconectar ou pausar a aba. O fluxo usa a mesma interface de input usada pelos controles de toque. Não substitui suporte a perfis Bluetooth que o navegador reporta como teclado ou a controles fora do layout padrão.

## 2026-11-06 — Controles PS1 ocultáveis e avaliação de outros cores

- A captura mostra o menu principal do frontend PCSX-ReARMed/RetroArch e os botões HTML do site sobre ele. Estar no menu significa que ainda não há confirmação de que a ROM entrou em jogo; o diagnóstico agora diz isso claramente.
- Os controles táteis passam ao modo automático: ocultos no computador e ocultos assim que a Gamepad API detecta um gamepad; em celular sem controle físico, ficam visíveis. Há botões **Mostrar/Ocultar controles** no painel e na área do jogo em dispositivos de toque; a preferência manual é salva neste navegador.
- Pesquisados motores alternativos: [PSoXide](https://github.com/EBonura/PSoXide-emulator) é um motor independente em Rust/GPL-2.0-or-later, com suporte WebAssembly e promessa de jogos comerciais chegando ao estado “in-game” em testes headless, mas seu player web público apresenta homebrew, não inclui controles táteis e ainda não demonstra compatibilidade suficiente para substituir o core em produção; [PCSX-Redux](https://github.com/pcsx-redux/pcsx-redux) declara seu build de navegador altamente experimental, não funcional para uso normal, com boot de OpenBIOS apenas e dependência de WebGL2/SharedArrayBuffer; [WASMpsx](https://github.com/js-emulators/wasmpsx) oferece uma integração web pequena sob MIT, mas sem evidência de compatibilidade/atividade comparável ao core atual. ARMSX1 foi descartado para integração: o README declara material proprietário e veda redistribuição/modificação sem autorização.
- Decisão provisória: manter o core atual até um POC alternativo demonstrar leitura da ROM comercial do usuário, controles e saves no navegador; trocar pelo nome do projeto sem essa validação repetiria o mesmo problema sob outra interface.
- Verificações locais registradas ao finalizar: `node --check src/app.js`, `git diff --check`; não há controle físico nem ROM do usuário neste ambiente. Referências primárias: [PSoXide: demo browser e limitações](https://ebonura.github.io/PSoXide/docs/browser-examples/), [PCSX-Redux: estado do build browser](https://github.com/pcsx-redux/pcsx-redux#where), [WASMpsx: API web e licença](https://github.com/js-emulators/wasmpsx).

## 2026-11-06 — Painel compacto, paisagem e isolamento de toque

- O painel PS1 agora começa recolhido e não aparece em sessões GBC/GBA. Na tela cheia, título, ações gerais e texto auxiliar são escondidos; fica um pequeno acesso `⋯` para opções e um botão discreto para sair. O ajuste usa a área segura do aparelho e o espaço do jogo ocupa o viewport disponível.
- Em GBC/GBA, os controles nativos do EmulatorJS seguem a preferência automática: visíveis em toque, ocultos em desktop e quando a Gamepad API encontra controle físico. A aba do jogo alterna a visibilidade manualmente. No PS1 o D-pad/analógico próprio mantém a mesma regra; a configuração de layout está no painel recolhível.
- Eventos de ponteiro iniciados na camada de toque do PS1 e nos botões do site agora são interrompidos antes de chegar ao frontend do EmulatorJS. Isso corrige o caminho de evento que podia abrir o menu RetroArch quando a pessoa tocava controles ou opções.
- Leitura das capturas: a imagem do GBA mostra efetivamente uma tela de jogo (`mGBA em execução`); nesse exemplo o problema visível é a interface/controles sobre a imagem. Na captura do PS1, o diagnóstico diz que o arquivo foi montado, mas não confirma que o conteúdo foi aceito; o core segue no menu, então boot de PS1 permanece pendente e não foi mascarado como resolvido.
- Verificado estaticamente: `node --check src/app.js` e `git diff --check`. Sem iPhone, tablet, ROM/BIOS ou controle físico disponíveis para validar interação/rotação real; publicação precisa ser confirmada após push.

## 2026-11-06 — Regressão provável no carregamento CUE/BIN desktop

- Comparação do histórico localizou uma mudança em `de4f5c5` (19:07): o desktop deixou de empacotar conjuntos CUE/M3U e faixas em ZIP e passou a abrir o índice diretamente com companions em `EJS_externalFiles`. Antes dessa alteração, o caminho `EJS_externalFiles` era restrito a iPhone/iPad para reduzir uso de memória; desktop usava o ZIP local.
- A captura mais recente é de computador e mostra o menu do PCSX-ReARMed. Restaurei o fluxo ZIP no desktop e mantive `EJS_externalFiles` em iOS. A inicialização automática (`EJS_startOnLoaded`), core e configuração de BIOS não foram alterados.
- Causa provável, ainda não validada com a ROM do usuário: o caminho novo de companions não está fazendo o core carregar o CUE no desktop. A restauração foi comparada com o estado anterior do código. Falta o usuário testar o mesmo conjunto CUE/BIN; só então será possível confirmar o boot.
- Fontes: histórico Git local (`de4f5c5` e seu pai); documentação oficial do EmulatorJS para [`EJS_externalFiles`](https://emulatorjs.org/docs/options/) descreve caminhos no filesystem virtual, mas não garante comportamento de todo CUE/BIN ou core.

## 2026-11-06 — BIOS local no iOS e engrenagem sobreposta

- A análise do loader oficial EmulatorJS 4.2.3 encontrou a causa do caminho da BIOS: `downloadGameFile()` grava o BIOS usando o nome no fim da URL. O app estava convertendo a BIOS escolhida em uma URL `blob:`; essa URL termina em identificador aleatório e o core não procura o firmware sob esse nome. Agora o BIOS selecionado entra por `EJS_externalFiles` com o nome original, preservado no filesystem virtual.
- Os BIN companheiros do CUE no fluxo iOS são lidos em amostras antes de iniciar o core; falha do provedor de arquivos passa a aparecer antes da tela do RetroArch.
- O atalho de configurações foi movido para junto do botão de sair da tela cheia, no canto superior esquerdo, e o rótulo de sair foi encurtado. O identificador do CSS foi renovado para que Safari baixe a posição atualizada sem cache antigo.
- Fontes: [opções oficiais EmulatorJS (`EJS_externalFiles`)](https://emulatorjs.org/docs/options/), [PCSX-ReARMed BIOS e nomes aceitos](https://docs.libretro.com/library/pcsx_rearmed/). `EJS_externalFiles` carrega os arquivos antes da ROM no código 4.2.3. A correção precisa de teste no iPhone com o arquivo BIOS/CUE/BIN do usuário; ainda não foi possível observar o boot real neste ambiente.

## 2026-11-06 — Correção de diagnóstico PS1 por falha de VFS

- Evidência fornecida pelo usuário: PCSX-ReARMed abre o CUE (93 bytes), mas registra `File not found in virtual FS: track1.bin`; a BIOS aparece montada em `/system/`. Isso confirma falha ao localizar uma faixa no VFS, não falta de BIOS nem pressão de memória por si só.
- Revisão do código encontrou que as URLs Blob do CUE/faixas eram revogadas imediatamente no callback `EJS_onGameStart`. Mantidas durante a sessão para evitar invalidar uma leitura assíncrona do core; são revogadas ao sair/recarregar a página.
- Com `?debug=1`, o app agora ativa `EJS_DEBUG_XX` e registra nome/tamanho de cada faixa resolvida, caminho virtual montado e presença/tamanho dos arquivos no VFS, além de erros JS e promises rejeitadas. Nenhum conteúdo de ROM é registrado.
- Limitação de validação: sem conseguir observar a execução real no dispositivo, a correção do boot ainda precisa ser confirmada com o mesmo CUE/BIN. A nova telemetria deve indicar se a faixa chegou ao VFS e em qual caminho.

## 2026-11-06 — Ajustes de toque PS1

- Barra de ferramentas do EmulatorJS começa oculta no PS1 para evitar abrir ou cobrir opções ao tocar Start/Select junto às bordas; um botão `☰` junto à engrenagem permite mostrá-la ou ocultá-la.
- Painel PS1 adiciona controles deslizantes independentes para tamanho de D-pad e analógico (88–220 px), com preferências persistidas localmente.
- Painel de ajustes pode ser minimizado e arrastado; ao entrar em **Arrastar controles**, ele se fecha automaticamente para deixar os botões acessíveis. A posição do painel é salva e limitada à área visível após redimensionar/rotacionar.
- Cache de CSS/JS renovado para que GitHub Pages e navegadores móveis baixem as mudanças.
- Validação: sintaxe de `src/app.js` e `git diff --check`; teste tátil e rotação em iPhone ainda dependem de validação no aparelho.

## 2026-11-06 — Perfis de controle por orientação

- PS1 agora mantém layouts distintos de retrato e paisagem e alterna entre eles automaticamente ao girar ou redimensionar a tela. O modo D-pad/analógico e os tamanhos continuam compartilhados entre orientações.
- Migração: o layout único antigo é preservado como paisagem; retrato começa com um posicionamento clássico dentro dos limites da tela. Alterações futuras em cada orientação são persistidas separadamente.
- GBC/GBA continuam usando os controles virtuais do EmulatorJS; tamanhos e margens recebem regras responsivas para retrato/paisagem.
- Cache dos arquivos JS/CSS renovado. `node --check src/app.js` e `git diff --check` passaram; interação real ainda precisa de confirmação no celular.

## 2026-11-06 — Correção de controles de toque GBC/GBA

- A opção mostrar/ocultar agora aplica estado explícito ao contêiner do EmulatorJS; quando mostrar estiver ativo, controles virtuais são forçados visíveis mesmo se o core os deixar ocultos por estilo interno.
- Em GBC/GBA, toques no canvas deixam de gerar eventos sintéticos que abriam a barra do emulador. As áreas vazias dos controles recebem proteção contra o menu acidental sem bloquear os listeners dos botões; o ícone nativo de abrir controles é preservado.
- PS1 não foi alterado por esta correção. CSS e JavaScript receberam identificador novo de cache.
- Verificação solicitada: checagem de sintaxe JS e whitespace; validação de controles físicos no iPhone depende do dispositivo.
- Referências do diagnóstico: [documentação oficial de opções EmulatorJS](https://emulatorjs.org/docs/options/) e [issue EmulatorJS sobre vazamento de toque da área vazia do gamepad](https://github.com/EmulatorJS/EmulatorJS/issues/1221).
## 2026-11-06 — Rótulos dos botões GBC/GBA

- Os rótulos longos dos controles virtuais de GBC/GBA agora usam tamanho de texto responsivo, centralização e limite interno para caber dentro dos próprios botões. Família tipográfica, cor e transparência continuam as mesmas.
- Regras limitadas à sessão de GBC/GBA; PS1 permanece inalterado. Cache JS/CSS atualizado.
- Validação: `node --check src/app.js` e `git diff --check`.

## 2026-11-06 — Rótulos dos botões inferiores GBC/GBA

- Complementada a regra anterior com seletores dos grupos superior e inferior do gamepad do EmulatorJS, onde Select, Start, Rápido e Lento são renderizados separadamente dos botões de ação.
- Texto responsivo, centralizado e contido no botão; cores, família tipográfica e transparência mantidas. A regra é restrita às sessões GBC/GBA.
- Cache JS/CSS atualizado. Verificações: `node --check src/app.js` e `git diff --check`.

## 2026-11-06 — Saída do jogo e tela cheia

- Diagnóstico: a proteção de toque do GBA/GBC interceptava cliques em componentes da interface do EmulatorJS, incluindo controles de confirmação e o botão de tela cheia. O rótulo expandido de mostrar/ocultar controles também podia ocupar a área clicável do botão Sair.
- A proteção agora preserva botões, diálogos e controles da barra e atua apenas no canvas/espaços vazios do gamepad. O atalho GBA/GBC fica compacto em tela cheia.
- Ao receber o evento oficial `exit` do EmulatorJS, o app encerra a sessão, libera recursos locais e sai da tela cheia. Aplicável a GBA, GBC e PS1.
- Verificações locais: `node --check src/app.js` e `git diff --check`. O teste de toque ainda depende do navegador móvel do usuário.
- Referências: [opções oficiais do EmulatorJS (`EJS_askBeforeExit`)](https://emulatorjs.org/docs/options/) e [eventos da API EmulatorJS](https://deepwiki.com/EmulatorJS/EmulatorJS/8-api-reference).

## 2026-11-06 — Integração opcional com Google Drive (branch `feature/google-drive-roms`)

- Criada branch separada antes das alterações; `main` permanece intacta.
- Adicionado botão do Google Drive, configuração local de Client ID / API key / Project number, carregamento oficial do Google Identity Services e Picker com seleção múltipla.
- O app usa o escopo `drive.file` e lê somente arquivos escolhidos pelo usuário com Drive API `files.get?alt=media`. O token fica em memória; as ROMs viram objetos File temporários na aba e seguem a mesma validação GBC/GBA/PS1 já existente, incluindo CUE/BIN/M3U.
- Nenhuma ROM ou token é gravado no aparelho ou enviado ao backend do projeto. A ROM ainda trafega pela rede e usa memória durante a sessão; a emulação permanece no dispositivo e arquivos grandes podem exceder os limites de memória do navegador.
- Documentado o setup do Google Cloud em `docs/GOOGLE_DRIVE.md`, incluindo restrições da API key, origem GitHub Pages e `localhost`.
- Limite de verificação: os IDs/credenciais Google do proprietário ainda não foram configurados; portanto, a autorização real e a seleção do Picker precisam de validação na branch com o projeto Cloud do usuário.


## 2026-11-07 — Etapa: autenticação segura do Google Drive (branch experimental)

### Feito

- Criada a branch `feature/google-drive-secure-login`; ela ainda não substitui a versão de produção.
- Removidos do formulário público os campos de Client ID, API key e número do projeto. A página agora mostra o estado da conexão e oferece limpar a sessão.
- Preparado o fluxo Google Identity Services Authorization Code em janela oficial, com troca do código numa Cloudflare Pages Function.
- O escopo continua limitado a `drive.file`; o Client Secret fica no ambiente do Cloudflare, tokens são temporários e não são guardados no navegador ou servidor.
- Adicionados endpoints Pages em `functions/api/google/config.js` e `functions/api/google/token.js`, com origem permitida, cabeçalho anti-CSRF, validação de método e resposta sem cache.
- Atualizada a documentação para o domínio `retroarcade.xyz.br`, variáveis de produção/preview e limites de privacidade.

### O que falta

- Criar um projeto Google Cloud dedicado ao Retro Arcade, habilitar Drive API e Picker API e configurar OAuth.
- Cadastrar as variáveis no Cloudflare Pages: GOOGLE_CLIENT_ID, GOOGLE_API_KEY, GOOGLE_PROJECT_NUMBER e GOOGLE_CLIENT_SECRET (este último como **Secret**, nunca no Git).
- Fazer deploy da branch de teste e validar autorização, Picker, leitura de um arquivo pequeno e início de jogo. Ainda não foi possível validar a autenticação real sem as credenciais do proprietário.
- Após validação, integrar a branch à produção Cloudflare. O GitHub Pages antigo ainda precisa ser despublicado nas configurações do repositório.
- Verificação de sintaxe JavaScript concluída para o app, módulo Drive e duas Pages Functions; isso não substitui o teste OAuth real no navegador.
