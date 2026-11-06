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
