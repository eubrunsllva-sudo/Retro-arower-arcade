# Retro / Browser Arcade

Projeto de emulação retrô para navegador, com interface em português e seis sistemas no escopo inicial: Game Boy Color, Game Boy Advance, Nintendo 64, PlayStation, Dreamcast e PSP.

> **Estado atual:** GBC/GBA e PS1 em integração experimental via EmulatorJS 4.2.3. PS1 usa o core `psx` (PCSX-ReARMed). Aceita imagem de disco única `.chd`, `.pbp` ou `.iso`; conjuntos `.cue/.bin` e listas multidisco ainda não são suportados pelo seletor individual. Não há certificação em aparelho físico.

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

A página inclui um diagnóstico pela Gamepad API. Conecte o controle antes ou depois de abrir o site e toque em **Verificar controle**. Se o iPega for listado, abra o menu de controles do EmulatorJS para mapear/confirmar os botões. Se não aparecer, o controle provavelmente está pareado em modo de teclado ou num modo incompatível com Gamepad API; remova o pareamento e refaça em modo Gamepad/HID, então recarregue a página. No iOS, o suporte a gamepads depende da versão do sistema, navegador e perfil Bluetooth do controle; o site não pode remover essas limitações. O controle virtual na tela é alternativa para toque.

**iPhone:** o seletor não restringe extensões nativamente, pois o iOS pode não tratar extensões de ROM como `.gba` de forma compatível no filtro. Toque em **Escolher um jogo**, selecione o arquivo no app Arquivos e a página valida a extensão depois de recebê-lo. Se o arquivo estiver em um provedor de nuvem/compartilhamento e tocar nele não retornar ao Safari, copie-o para **No Meu iPhone** pelo app Arquivos e selecione a cópia local; algumas combinações iOS/provedor têm falhas no seletor.

### Tela cheia no celular

Na sessão do jogo, toque em **Tela cheia**. Em iPhone, o navegador pode não oferecer a API de tela cheia para elementos comuns da página; o site usa um modo expandido próprio que ocupa o viewport disponível e mantém **Sair da tela cheia** visível. As barras do Safari podem continuar aparecendo. Gire o aparelho manualmente para paisagem quando preferir; o site não força orientação.
