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

O seletor HTML permite escolher arquivos, mas não dá ao site acesso irrestrito ao sistema de arquivos. iOS pode ter experiência de seleção e persistência diferente do Android/desktop. Arquivos de jogo são lidos localmente e não são enviados. O loader/core é obtido da CDN oficial do EmulatorJS 4.2.3; portanto, a primeira execução exige conexão.

Escolha ROMs sem compactação para GBC/GBA: `.gb`/`.gbc` e `.gba`. Para PS1, pode escolher uma imagem única `.chd`, `.pbp` ou `.iso`, ou selecionar os arquivos `.cue`/`.bin` em conjunto (também há seletor de pasta em navegadores que o suportam). A varredura reúne listas M3U, CUE e imagens individuais; evita repetir discos já incluídos em uma lista multidisco. O app valida as linhas `FILE` do CUE, relata itens faltantes e só então habilita **Iniciar jogo**. BIN sem CUE é listado à parte (faixas Track são agrupadas), mas esse formato não garante o tipo/faixa do disco e pode não iniciar sem o CUE correto. Ao preparar, cria um pacote ZIP temporário no aparelho para que o core encontre as faixas. Para jogos em vários discos, selecione `.m3u` junto com todos os CUE/BIN dos discos; o menu do EmulatorJS poderá oferecer troca de disco. O ZIP temporário é aberto pelo core, não enviado. Extraia arquivos `.zip` de origem antes de selecionar. O cartão removível não muda o tipo do arquivo que o navegador entrega depois da escolha. Esse fluxo foi validado por inspeção e verificação estática; boot com discos reais ainda depende de teste no aparelho do usuário.

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

GitHub Pages hospeda os arquivos estáticos. ROMs e saves não são enviados pelo fluxo de deploy. O emulador roda localmente no navegador; não é streaming de uma máquina na nuvem. Seleção de ROM é iniciada pelo usuário em cada aparelho e limitada aos arquivos escolhidos no seletor nativo.

## Gamepad e iOS

A interface mostra os controles que o navegador reporta via Gamepad API. Ausência nessa lista indica que o navegador não reportou um dispositivo HID gamepad à página; remapeamento dentro do EmulatorJS não corrige modo Bluetooth/pareamento. Conecte em perfil Gamepad/HID e reavalie. A compatibilidade de controle Bluetooth em iPhone/iPad depende do modelo do controle, versão do iOS e navegador. GitHub Pages fornece HTTPS, mas não elimina limitações de APIs dos navegadores móveis.

## Hospedagem

GitHub Pages hospeda os arquivos estáticos. ROMs e saves não são enviados pelo fluxo de deploy. O emulador roda localmente no navegador; não é streaming de uma máquina na nuvem. Seleção de ROM é iniciada pelo usuário em cada aparelho e limitada aos arquivos escolhidos no seletor nativo.
