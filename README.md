# Retro / Browser Arcade

Projeto de emulação retrô para navegador, com interface em português e seis sistemas no escopo inicial: Game Boy Color, Game Boy Advance, Nintendo 64, PlayStation, Dreamcast e PSP.

> **Estado atual:** GBC/GBA e PS1 em integração experimental via EmulatorJS 4.2.3. PS1 usa o core `psx` (PCSX-ReARMed). Aceita `.chd`, `.pbp` e `.iso`, além de conjuntos `.cue/.bin` e listas `.m3u` ao selecionar arquivos companheiros juntos ou a pasta do jogo. Ainda não há certificação de jogo real em aparelho físico.

## Princípios

- O jogo pode ser escolhido no aparelho ou, após configurar credenciais próprias, selecionado no Google Drive. A autorização usa GIS Authorization Code com função Cloudflare Pages e escopo drive.file; não há catálogo de ROMs.
- GBC/GBA/PS1 carregam loader/core da CDN oficial EmulatorJS; a primeira execução exige internet. ROMs locais não são enviadas; as do Drive passam temporariamente pela memória do navegador. O Client Secret fica somente como segredo no Cloudflare, e tokens não são persistidos.
- O autosave local SRAM está ligado em intervalo de 30 segundos. A barra do motor oferece controles de pausa/reinício, mapeamento de controles, tela cheia, save/load state e SRAM. Os recursos de save ainda precisam de validação ponta a ponta.
- Não distribuímos jogos, BIOS proprietárias ou links para cópias não autorizadas. Para PS1, o núcleo aceita BIOS própria opcional; sem ela pode recorrer ao HLE, com compatibilidade menor.
- Chrome, Edge, Firefox, Android e iOS serão alvos de teste; esta etapa ainda não garante compatibilidade em qualquer aparelho. No iOS, o Safari é o motor de navegador subjacente mesmo para outros navegadores.

## Rodar localmente

Como esta etapa usa apenas HTML, CSS e JavaScript, não há dependências npm.
Abra pelo servidor local indicado abaixo; não dê duplo clique em `index.html`. O motor WebAssembly depende de uma origem web segura/servida. O acesso ao Drive usa as funções do Cloudflare Pages e não funciona no servidor HTTP estático simples.

```powershell
cd outputs/retro-browser
python -m http.server 8000
```

Abra `http://localhost:8000` para testar a emulação local. Para testar Drive em desenvolvimento, use Cloudflare Pages Preview com as variáveis de ambiente configuradas. A produção atual está hospedada em `https://retroarcade.xyz.br`.

## Documentação

- [Plano por etapas](docs/ROADMAP.md)
- [Decisões técnicas e pesquisa](docs/DECISIONS.md)
- [Compatibilidade e limites](docs/COMPATIBILITY.md)
- [Progresso, sucessos e falhas](docs/PROGRESS.md)
- [Configurar Google Drive](docs/GOOGLE_DRIVE.md)
- [Avisos de terceiros](THIRD_PARTY_NOTICES.md)

## Próxima etapa

Uma branch experimental prepara o fluxo OAuth seguro do Google Drive. Ainda faltam credenciais do projeto Google Cloud, variáveis no Cloudflare e validação ponta a ponta. Consulte [guia Google Drive](docs/GOOGLE_DRIVE.md) e [progresso e limitações](docs/PROGRESS.md).

## Acessar pela nuvem

O site de produção está em:

https://retroarcade.xyz.br

O Cloudflare Pages publica a branch de produção configurada no projeto. A integração de login do Google está em uma branch experimental até que as credenciais Cloudflare/Google sejam configuradas e o fluxo seja validado. O antigo GitHub Pages ainda precisa ser despublicado manualmente em **Repository → Settings → Pages → Unpublish site**; o código-fonte e o histórico do repositório permanecem no GitHub.

A ROM do Drive é lida da API Google para a memória da aba; o site não guarda a ROM no aparelho nem envia o arquivo para o servidor do projeto.
### Controles

A página inclui um diagnóstico pela Gamepad API. Conecte o controle antes ou depois de abrir o site e toque em **Verificar controle**. No PS1, a integração normaliza os índices dos controles ativos antes de carregar EmulatorJS 4.2.3 (contorno para falha de polling da versão) e envia um mapa padrão. Se algum botão não corresponder, abra Configurações → Controles no emulador e remapeie. O diagnóstico mostra quantos botões estão pressionados naquele instante. Se o iPega não aparecer, o navegador não o reportou como gamepad. No iOS, suporte depende da versão do sistema, navegador e perfil Bluetooth do controle; o controle virtual é alternativa para toque.

**Diagnóstico no iPhone:** Chrome para iOS não tem console de desenvolvedor integrado. Para abrir um console na própria página, acrescente `?debug=1` ao endereço (por exemplo, `https://eubrunsllva-sudo.github.io/Retro-arower-arcade/?debug=1`), toque no ícone flutuante do Eruda e abra **Console**; deixe-o carregado antes de iniciar a ROM para capturar erros desde o início. A aba **Network** ajuda a conferir carregamento de arquivos e recursos. Sem esse parâmetro, o Eruda não é carregado e nenhum botão extra aparece. Para depuração remota com Mac, ative **Ajustes > Apps > Safari > Avançado > Inspetor da Web** no iPhone; no Safari do Mac, ative os recursos de desenvolvedor e use **Desenvolver > [iPhone] > [página]**. Essa inspeção remota é documentada pela Apple para páginas abertas no Safari; no Chrome iOS, use o Eruda na própria página.
**iPhone:** o seletor não restringe extensões nativamente, pois o iOS pode não tratar extensões de ROM como `.gba` de forma compatível no filtro. Toque em **Escolher um jogo**, selecione o arquivo no app Arquivos e a página valida a extensão depois de recebê-lo. Se o arquivo estiver em um provedor de nuvem/compartilhamento e tocar nele não retornar ao Safari, copie-o para **No Meu iPhone** pelo app Arquivos e selecione a cópia local; algumas combinações iOS/provedor têm falhas no seletor.

**PlayStation 1:** com CUE/BIN, selecione o `.cue` e todos os `.bin` que ele referencia na mesma seleção (ou selecione a pasta que os contém em navegadores compatíveis). Para jogos multidisco, selecione o `.m3u` e os CUE/BIN de todos os discos. A varredura também lista imagens `.chd/.pbp/.iso` individuais da pasta sem repetir mídia já incluída em M3U. BIN sem CUE aparece como candidato provisório (faixas Track são agrupadas); o app tenta criar um CUE local, mas esse modo não garante compatibilidade. No computador, conjuntos CUE/M3U voltam a ser empacotados em ZIP local, como no fluxo anterior; no iPhone/iPad, os arquivos companheiros são passados por `EJS_externalFiles` para evitar a cópia grande em memória. Nada é enviado. Na seleção de pastas, se dois discos tiverem arquivos de mesmo nome e o navegador não preservar caminhos relativos, separe os arquivos numa pasta por jogo antes de selecionar.

### Tela cheia no celular

Na sessão do jogo, toque em **Tela cheia**. No modo expandido, cabeçalho, painel e texto auxiliar ficam ocultos para priorizar o jogo; o botão discreto `⋯` abre opções e o botão de saída permanece no canto superior. Em iPhone, o navegador pode manter suas barras próprias. A área do jogo é recalculada ao girar; o site não força orientação.

## PS1 — controles virtuais e menu do core

A tela usa D-pad ou analógico (escolha exclusiva), com posições que podem ser movidas por arrasto e ficam salvas no navegador. A aba **CONTROLES · AJUSTES** abre as configurações PS1; em GBC/GBA alterna a visibilidade do controle virtual do EmulatorJS. Por padrão, controles virtuais aparecem em dispositivos de toque e ficam ocultos em computadores ou quando há gamepad detectado. No PS1, toques nos botões próprios são isolados do frontend do core para que não abram seu menu por engano. O projeto não inclui BIOS. O boot e a proporção final precisam de teste físico em iPhone/iPad; se o menu do RetroArch aparecer, o estado sob o título informa se o arquivo aparece no sistema de arquivos interno do core. Isso não confirma que o core aceitou ou iniciou a imagem.

### PS1 — controle de toque e CUE/BIN

O PS1 usa uma sobreposição própria com layout clássico (D-pad ou analógico, nunca ambos simultaneamente), botões △ ○ × □, L1/L2, R1/R2 e Start/Select. Ela fica oculta automaticamente no computador e quando o navegador detecta um gamepad; no celular sem gamepad, aparece por padrão. Posições de retrato e paisagem são ajustadas e salvas separadamente; ao girar, o app troca para o layout daquela orientação. O layout antigo é preservado como paisagem e retrato recebe um padrão visível, sem botões cortados. Use **Mostrar/Ocultar controles** se preferir mudar isso manualmente. No painel **⚙**, escolha o tamanho do D-pad e do analógico, alterne a direção e minimize ou mova o painel. **Arrastar controles** fecha o painel para liberar a tela; as posições ficam salvas neste navegador. A barra do EmulatorJS fica oculta no jogo; use o botão **☰** no topo para mostrá-la ou escondê-la. GBC/GBA usam os controles virtuais do EmulatorJS, forçados visíveis quando a preferência é mostrar e ocultos quando a preferência é ocultar. Toques na área de jogo não abrem acidentalmente a barra do EmulatorJS; os controles e o botão próprio do gamepad permanecem operáveis. No desktop, CUE/M3U e seus arquivos companheiros são empacotados em ZIP local; em iPhone/iPad o app usa `EJS_externalFiles` para reduzir cópias grandes em memória. A BIOS escolhida permanece local e é disponibilizada ao core com seu nome original, sem ser enviada. Se o core abrir no menu do RetroArch, veja o diagnóstico sob o título: presença do arquivo no sistema de arquivos interno não confirma que a imagem foi aceita ou que o jogo iniciou.
