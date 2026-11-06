# Avisos de terceiros

## Integrações experimentais — EmulatorJS 4.2.3

- **EmulatorJS 4.2.3**, licença GPL-3.0: loader e dados carregados em tempo de execução de `https://cdn.emulatorjs.org/4.2.3/data/`. Este repositório não contém código, WASM, core, ROM ou BIOS do EmulatorJS.
- Cores selecionados: Gambatte para GB/GBC, mGBA para GBA e PCSX-ReARMed para PS1 (`psx`). A documentação Libretro lista PCSX-ReARMed sob GPL-2.0. Os cores são carregados da CDN do EmulatorJS, não incluídos neste repositório. Antes de espelhar/distribuir artefatos, revisar a licença e a fonte correspondente de cada core/dependência.
- A aplicação contém apenas a integração/configuração própria. Google Fonts continua carregado remotamente no CSS.
- Não há jogos, BIOS ou firmware incluídos. BIOS real de PS1 deve ser fornecida pelo próprio usuário; sem ela, PCSX-ReARMed pode recorrer a HLE.

## Candidatos pesquisados (não incorporados)

- EmulatorJS — https://github.com/EmulatorJS/EmulatorJS — GPL-3.0.
- WebRetro — https://github.com/binbashbanana/webretro — licença e dependências devem ser verificadas na versão escolhida.
- Flycast WASM — https://github.com/nasomers/flycast-wasm — licença, dependências e status experimental devem ser confirmados antes do uso.

Antes de empacotar o runtime em um build próprio, este arquivo deverá listar commits, licenças de todos os cores/dependências, modificações e instruções de obtenção do código-fonte correspondente. A distribuição de runtime pela CDN é uma dependência externa e requer internet.
