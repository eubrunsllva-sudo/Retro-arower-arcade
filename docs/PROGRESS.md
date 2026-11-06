# Registro de progresso

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
