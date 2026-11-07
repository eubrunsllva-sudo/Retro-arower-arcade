# Matriz de compatibilidade

Esta tabela separa alvo de produto e suporte já demonstrado. GBC/GBA/PS1 têm integração experimental via EmulatorJS; execução em aparelhos reais ainda não está certificada.

| Console | Alvo | Estado nesta etapa | Observações a validar |
|---|---|---|---|
| Game Boy Color | Chrome, Edge, Firefox, Android, iOS | Experimental, não testado em aparelho | ROM `.gb`/`.gbc`; Gambatte via `gb`; SRAM local; controles/áudio/restart ainda precisam teste |
| Game Boy Advance | Chrome, Edge, Firefox, Android, iOS | Experimental, não testado em aparelho | ROM `.gba`; mGBA via `gba`; SRAM local; desempenho/controles/áudio ainda precisam teste |
| Nintendo 64 | Chrome, Edge, Firefox, Android, iOS | Planejado | Desempenho varia por jogo e aparelho; vídeo/WebGL |
| PlayStation | Chrome, Edge, Firefox, Android, iOS | Experimental, sem ROM real validada | core `psx`/PCSX-ReARMed; `.chd`, `.pbp`, `.iso`; grupos `.cue/.bin` e listas `.m3u` via seleção múltipla/pasta. O app verifica arquivos citados e habilita iniciar quando o conjunto está completo. BIOS própria opcional; HLE tem compatibilidade variável. |
| Dreamcast | Chrome, Edge, Firefox, Android, iOS | Planejado | Candidato separado Flycast WASM; aparelho pode ser limitante |
| PSP | Chrome, Edge, Firefox, Android, iOS | Planejado | Threads/SharedArrayBuffer e requisitos de hospedagem podem limitar navegadores |

## Acesso a arquivos

O seletor HTML permite escolher arquivos, mas não dá ao site acesso irrestrito ao sistema de arquivos. Opcionalmente, o Google Picker pode abrir ROMs de Drive após configurar Client ID, chave API e projeto Google Cloud; o app pede `drive.file` para os arquivos escolhidos. O conteúdo é lido para a memória da aba, sem salvá-lo no aparelho nem enviá-lo a um servidor do projeto. iOS pode ter limites de memória e diferenças de seleção. O loader/core é obtido da CDN oficial do EmulatorJS 4.2.3; a primeira execução exige conexão. Consulte [o guia Drive](GOOGLE_DRIVE.md).

Escolha ROMs sem compactação para GBC/GBA: `.gb`/`.gbc` e `.gba`. Para PS1, pode escolher uma imagem única `.chd`, `.pbp` ou `.iso`, ou selecionar os arquivos `.cue`/`.bin` em conjunto (também há seletor de pasta em navegadores que o suportam). A varredura reúne listas M3U, CUE e imagens individuais; evita repetir discos já incluídos em uma lista multidisco. O app valida as linhas `FILE` do CUE, relata itens faltantes e só então habilita **Iniciar jogo**. BIN sem CUE é listado à parte (faixas Track são agrupadas), mas não garante o tipo/faixa do disco; esse fluxo cria um pacote ZIP temporário para tentar gerar um CUE local. No desktop, conjuntos CUE/M3U e faixas voltam a ser empacotados em ZIP local, o fluxo usado antes da regressão identificada em 06/11/2026. No iPhone/iPad, o índice continua sendo passado com os arquivos companheiros por `EJS_externalFiles` para reduzir o pico de memória. Para jogos em vários discos, selecione `.m3u` junto com todos os CUE/BIN dos discos; nenhum pacote ou ROM é enviado. Extraia arquivos `.zip` de origem antes de selecionar. O cartão removível não muda o tipo do arquivo que o navegador entrega depois da escolha. A restauração do caminho desktop é uma correção baseada no histórico e ainda precisa ser confirmada com o conjunto CUE/BIN que falhava.

O autosave SRAM do EmulatorJS escreve no IndexedDB do navegador. A barra do motor também expõe save/load state e exportação/importação SRAM. Esses comandos ainda não foram verificados em teste de ponta a ponta. Limpeza de dados, quota esgotada ou políticas de armazenamento privado podem remover os saves.

## BIOS e saves de PS1

O core PCSX-ReARMed consegue iniciar sem BIOS usando HLE, mas alguns jogos podem apresentar incompatibilidades. O seletor pode receber uma BIOS que o usuário já possua; o projeto não inclui nem baixa firmware. A emulação de cartão de memória é gerenciada pelo core/frontend e o autosave de 30 segundos está configurado; falta validar gravação, retomada e exportação numa sessão PS1 real. Em iPhone/iPad, CUE/M3U e faixas são fornecidos ao core como arquivos locais separados, sem ZIP intermediário, para reduzir cópias extras na memória. Mídias acima de 300 MiB exibem aviso de risco de memória (limite heurístico, não garantido); CHD pode reduzir o tamanho da entrada.

## Classificação futura

- **Testado:** execução repetível em aparelho e navegador informados, com teste identificado.
- **Parcial:** inicia, mas há falhas conhecidas (por exemplo, áudio, desempenho ou salvamento).
- **Não disponível:** núcleo ou recurso não funciona nesse ambiente.

Não publicar alegações como “funciona em qualquer iPhone” sem testar as versões do iOS/Safari e o modo de acesso usado.

## Suspensão e rotação no iOS

O app pausa o core quando a página fica oculta, tenta retomá-lo ao voltar e dispara redimensionamento após rotação. Isso é apenas melhor esforço: o WebKit pode congelar ou encerrar a aba para economizar recursos e o EmulatorJS tem um problema aberto de retomada em dispositivos Apple. Em caso de encerramento do processo, nenhum JavaScript consegue manter a emulação ativa em segundo plano nem recuperar o estado de execução que só estava na memória. Saves do jogo/cartão de memória permanecem dependentes do autosave do core; retomar exatamente o mesmo quadro após a aba ser encerrada não é garantido.

## Gamepad e iOS

A interface mostra os controles que o navegador reporta via Gamepad API. Para PS1, antes de carregar EmulatorJS 4.2.3 o app compacta e normaliza índices de controles ativos, contornando um defeito confirmado no polling desse core quando o índice não começa em zero; também passa um mapa padrão explícito ao EmulatorJS. No jogo, abra Configurações → Controles se o perfil variar. Um pad conectado não garante botões mapeados: confira se o diagnóstico muda a contagem de pressionados ao apertar botões. A compatibilidade Bluetooth em iPhone/iPad depende do modelo, versão do iOS e navegador; GitHub Pages em HTTPS não elimina limitações da Gamepad API.

## Hospedagem

GitHub Pages hospeda os arquivos estáticos; não recebe ROMs por deploy. O usuário pode escolher um arquivo do aparelho ou autorizar o Picker para um arquivo do Drive. No caso do Drive, os bytes são transferidos da Google API para a memória da aba, sem persistência no aparelho e sem passar por um servidor do projeto. O emulador roda localmente no navegador; não é streaming de uma máquina na nuvem.

## Gamepad e iOS

A interface mostra os controles que o navegador reporta via Gamepad API. Ausência nessa lista indica que o navegador não reportou um dispositivo HID gamepad à página; remapeamento dentro do EmulatorJS não corrige modo Bluetooth/pareamento. Conecte em perfil Gamepad/HID e reavalie. A compatibilidade de controle Bluetooth em iPhone/iPad depende do modelo do controle, versão do iOS e navegador. GitHub Pages fornece HTTPS, mas não elimina limitações de APIs dos navegadores móveis.

## Hospedagem

GitHub Pages hospeda os arquivos estáticos; não recebe ROMs por deploy. O usuário pode escolher um arquivo do aparelho ou autorizar o Picker para um arquivo do Drive. No caso do Drive, os bytes são transferidos da Google API para a memória da aba, sem persistência no aparelho e sem passar por um servidor do projeto. O emulador roda localmente no navegador; não é streaming de uma máquina na nuvem.

## PS1: entrada direta e controles de toque

O EmulatorJS está configurado para iniciar o conteúdo assim que o usuário selecionar **Iniciar jogo** (`EJS_startOnLoaded`) e mantém o botão `settings` na barra para acesso opcional às configurações. CUE/M3U passa o arquivo de índice por URL Blob e os companheiros por `EJS_externalFiles`. O controle PS1 próprio oferece D-pad ou analógico, nunca ambos; permite arrastar botões pela área de jogo e salva as posições localmente. O app também indica o caminho do conteúdo e se o arquivo está presente no sistema de arquivos do core. Esses ajustes ainda precisam ser validados com jogo real em navegador móvel.

## PS1 — leitura de disco e controles móveis

Para CUE/M3U, os arquivos referenciados são mapeados por `EJS_externalFiles` para o sistema de arquivos virtual do core e o índice é passado diretamente como conteúdo. Para alguns BIN sem índice, `EJS_disableCue:false` permite a criação de CUE automática do EmulatorJS; compatibilidade desse método varia por imagem. Depois do boot, a interface informa o nome do conteúdo escolhido e se o arquivo está presente no FS do core. Se o menu principal do RetroArch permanecer, o arquivo ainda não está rodando: use essa indicação para diferenciar caminho inexistente e imagem rejeitada.

No PS1, a sobreposição de toque do projeto permite escolher **D-pad** ou **analógico** de forma exclusiva e arrastar cada botão dentro da área de jogo. Preferências ficam no armazenamento local e as posições usam percentuais do viewport para se manterem proporcionais em retrato/paisagem. A rotação ajusta a apresentação, mas a suspensão/encerramento de aba pelo iOS continua sob controle do sistema.

A sobreposição de toque fica oculta por padrão em computador e quando um gamepad é detectado. Em celular sem gamepad, aparece automaticamente; o jogador pode alternar **Mostrar/Ocultar controles** e a preferência fica salva neste navegador.
