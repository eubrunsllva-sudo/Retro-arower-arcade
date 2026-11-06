# Retro / Browser Arcade

Projeto de emulação retrô para navegador, com interface em português e seis sistemas no escopo inicial: Game Boy Color, Game Boy Advance, Nintendo 64, PlayStation, Dreamcast e PSP.

> **Estado atual:** base concluída; GBC/GBA em integração experimental via EmulatorJS 4.2.3. A tela inicial traz os botões Escolher um jogo, Iniciar jogo (habilitado após selecionar ROM compatível) e Recarregar página. Os outros quatro consoles ainda não iniciam; não há certificação em aparelho físico.

## Princípios

- O jogo é escolhido no dispositivo do usuário; não há catálogo de ROMs nem envio de arquivos nesta versão.
- GBC/GBA carregam loader/core da CDN oficial EmulatorJS; a primeira execução exige internet. A ROM escolhida permanece no aparelho e não é enviada.
- O autosave local SRAM está ligado em intervalo de 30 segundos. A barra do motor oferece controles de pausa/reinício, mapeamento de controles, tela cheia, save/load state e SRAM. Os recursos de save ainda precisam de validação ponta a ponta. Google Drive não está implementado.
- Não distribuímos jogos, BIOS proprietárias ou links para cópias não autorizadas. O app poderá aceitar arquivos de firmware fornecidos pelo usuário quando o núcleo exigir.
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

O próximo passo é testar com homebrew legal, validar retomada do SRAM, controles e áudio, e implementar exportação/importação manual. Consulte [progresso e limitações](docs/PROGRESS.md).

## Acessar pela nuvem

Quando o GitHub Pages estiver habilitado e o fluxo **Publicar no GitHub Pages** terminar, acesse:

`https://eubrunsllva-sudo.github.io/Retro-arower-arcade/`

O workflow em `.github/workflows/pages.yml` publica automaticamente cada atualização da branch `main`. O site é servido por HTTPS. No celular, abra a URL e selecione uma ROM armazenada naquele aparelho. O navegador não permite que o site leia pastas inteiras livremente: é necessário escolher os arquivos; no iOS, use Safari ou navegador compatível e confirme a seleção no seletor do sistema. O jogo não é transmitido da nuvem: a emulação acontece localmente no navegador e a ROM não é enviada.

### Controles

A página inclui um diagnóstico pela Gamepad API. Conecte o controle antes ou depois de abrir o site e toque em **Verificar controle**. Se o iPega for listado, abra o menu de controles do EmulatorJS para mapear/confirmar os botões. Se não aparecer, o controle provavelmente está pareado em modo de teclado ou num modo incompatível com Gamepad API; remova o pareamento e refaça em modo Gamepad/HID, então recarregue a página. No iOS, o suporte a gamepads depende da versão do sistema, navegador e perfil Bluetooth do controle; o site não pode remover essas limitações. O controle virtual na tela é alternativa para toque.
