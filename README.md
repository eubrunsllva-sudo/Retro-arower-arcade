# Retro / Browser Arcade

Projeto de emulação retrô para navegador, com interface em português e seis sistemas no escopo inicial: Game Boy Color, Game Boy Advance, Nintendo 64, PlayStation, Dreamcast e PSP.

> **Estado atual:** GBC/GBA e PS1 em integração experimental via EmulatorJS 4.2.3. PS1 usa o core `psx` (PCSX-ReARMed). Aceita `.chd`, `.pbp` e `.iso`, além de conjuntos `.cue/.bin` e listas `.m3u` ao selecionar arquivos companheiros juntos ou a pasta do jogo. Ainda não há certificação de jogo real em aparelho físico.

## Princípios

- O jogo é escolhido no dispositivo do usuário; não há catálogo de ROMs nem envio de arquivos nesta versão.
- GBC/GBA/PS1 carregam loader/core da CDN oficial EmulatorJS; a primeira execução exige internet. A ROM escolhida permanece no aparelho e não é enviada.
- O autosave local SRAM está ligado em intervalo de 30 segundos. A barra do motor oferece controles de pausa/reinício, mapeamento de controles, tela cheia, save/load state e SRAM. Os recursos de save ainda precisam de validação ponta a ponta. Google Drive não está implementado.
- Não distribuímos jogos, BIOS proprietárias ou links para cópias não autorizadas. Para PS1, o núcleo aceita BIOS própria opcional; sem ela pode recorrer ao HLE, com compatibilidade menor.
- Chrome, Edge, Firefox, Android e iOS serão alvos de teste; esta etapa ainda não garante compatibilidade em qualquer aparelho. No iOS, o Safari é o motor de navegador subjacente mesmo para outros navegadores.

## Rodar localmente

Como esta etapa usa apenas HTML, CSS e JavaScript, não há dependências npm.
Abra pelo servidor local indicado abaixo (ou pelo GitHub Pages); não dê duplo clique em `index.html`. O motor WebAssembly depende de uma origem web segura/servida. A interface mostrará se o JavaScript do app não iniciou.

```powershell
cd outputs/retro-browser
python -m http.server 8000
```

Abra `http://localhost:8000`. Em produção, publique por HTTPS (por exemplo, GitHub Pages). Alguns recursos de navegador e os próximos núcleos exigem contexto seguro.

## Documentação

- [Plano por etapas](docs/ROADMAP.md)
- [Decisões técnicas e pesquisa](docs/DECISIONS.md)
- [Compatibilidade e limites](docs/COMPATIBILITY.md)
- [Progresso, sucessos e falhas](docs/PROGRESS.md)
- [Avisos de terceiros](THIRD_PARTY_NOTICES.md)

## Próxima etapa

O próximo passo é testar PS1 com imagem e BIOS próprias, confirmar o boot e validar controles, áudio e cartão de memória no navegador/aparelho desejado. Consulte [progresso e limitações](docs/PROGRESS.md).

## Acessar pela nuvem

O GitHub Pages está publicado. Acesse:

`https://eubrunsllva-sudo.github.io/Retro-arower-arcade/`

O workflow em `.github/workflows/pages.yml` publica automaticamente cada atualização da branch `main`. O site é servido por HTTPS. No celular, abra a URL e selecione uma ROM armazenada naquele aparelho. O navegador não permite que o site leia pastas inteiras livremente: é necessário escolher os arquivos; no iOS, use Safari ou navegador compatível e confirme a seleção no seletor do sistema. O jogo não é transmitido da nuvem: a emulação acontece localmente no navegador e a ROM não é enviada.

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

O PS1 usa uma sobreposição própria com layout clássico (D-pad ou analógico, nunca ambos simultaneamente), botões △ ○ × □, L1/L2, R1/R2 e Start/Select. Ela fica oculta automaticamente no computador e quando o navegador detecta um gamepad; no celular sem gamepad, aparece por padrão. Use **Mostrar/Ocultar controles** se preferir mudar isso manualmente. Toque em **Arrastar controles** para reorganizar os botões; as posições ficam neste navegador e se adaptam ao tamanho/rotação da área de jogo. No desktop, CUE/M3U e seus arquivos companheiros são empacotados em ZIP local; em iPhone/iPad o app usa `EJS_externalFiles` para reduzir cópias grandes em memória. A BIOS escolhida permanece local e é disponibilizada ao core com seu nome original, sem ser enviada. Se o core abrir no menu do RetroArch, veja o diagnóstico sob o título: presença do arquivo no sistema de arquivos interno não confirma que a imagem foi aceita ou que o jogo iniciou.
