# Avisos de terceiros

## Integração experimental — etapa 2

- **EmulatorJS 4.2.3**, licença GPL-3.0: loader e dados carregados em tempo de execução de `https://cdn.emulatorjs.org/4.2.3/data/`. Este repositório não contém código, WASM, core, ROM ou BIOS do EmulatorJS.
- Cores selecionados: Gambatte para GB/GBC e mGBA para GBA. Antes de espelhar ou distribuir os artefatos, revisar e registrar licença e fonte correspondente de cada core/dependência.
- A aplicação contém apenas a integração/configuração própria. Google Fonts continua carregado remotamente no CSS.
- Não há jogos, BIOS ou firmware incluídos. Para GBC/GBA, a documentação do EmulatorJS indica BIOS opcional.

## Candidatos pesquisados (não incorporados)

- EmulatorJS — https://github.com/EmulatorJS/EmulatorJS — GPL-3.0.
- WebRetro — https://github.com/binbashbanana/webretro — licença e dependências devem ser verificadas na versão escolhida.
- Flycast WASM — https://github.com/nasomers/flycast-wasm — licença, dependências e status experimental devem ser confirmados antes do uso.

Antes de empacotar o runtime em um build próprio, este arquivo deverá listar commits, licenças de todos os cores/dependências, modificações e instruções de obtenção do código-fonte correspondente. A distribuição de runtime pela CDN é uma dependência externa e requer internet.
