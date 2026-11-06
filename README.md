# Retro / Browser Arcade

Projeto de emulação retrô para navegador, com interface em português e seis sistemas no escopo inicial: Game Boy Color, Game Boy Advance, Nintendo 64, PlayStation, Dreamcast e PSP.

> **Estado atual:** etapa 1 de 6. A interface e a seleção de arquivo estão implementadas. Nenhum núcleo de emulação foi integrado ainda; selecionar uma ROM não inicia um jogo nesta versão.

## Princípios

- O jogo é escolhido no dispositivo do usuário; não há catálogo de ROMs nem envio de arquivos nesta versão.
- Os núcleos serão módulos substituíveis e avaliados por compatibilidade, licença, desempenho móvel e suporte de navegador.
- Salvamento automático local será a opção padrão. Exportar/importar saves manualmente será possível. Sincronização com Google Drive será opcional e virá depois, com autorização OAuth do próprio usuário.
- Não distribuímos jogos, BIOS proprietárias ou links para cópias não autorizadas. O app poderá aceitar arquivos de firmware fornecidos pelo usuário quando o núcleo exigir.
- Chrome, Edge, Firefox, Android e iOS serão alvos de teste; isso não significa compatibilidade garantida para todo aparelho ou jogo.

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

Integrar um núcleo de GBC/GBA em uma branch curta, testar jogos homebrew legalmente distribuídos, salvar/retomar SRAM no armazenamento local e medir inicialização, áudio, controles e consumo de memória. Só depois de validar esse caminho avançamos aos outros sistemas.
