# Decisões técnicas e pesquisa

Atualizado em 2026-11-06. Pesquisa feita nas páginas oficiais de documentação e repositórios.

## Interface separada dos motores

O app terá uma camada de biblioteca/controles e adaptadores independentes de emulação. Isso permite trocar um core sem refazer salvamento e interface, e evita assumir que um único pacote cobre os seis consoles igualmente. Nesta primeira etapa, a seleção identifica algumas extensões apenas como indicação: `.iso`, `.bin`, `.chd` e `.pbp` são compartilhadas entre sistemas, então extensão não comprova o console nem a validade do conteúdo.

## Candidatos iniciais

- **EmulatorJS 4.2.3** foi escolhido como primeiro adaptador e é carregado da CDN oficial, sem vendorização nesta fase. A documentação define `gb` (Gambatte) e `gba` (mGBA), com BIOS opcional para esses consoles. Ainda é preciso revisar licença de cada core antes de empacotar/redistribuir os binários; usar CDN não elimina a obrigação de avisos aplicáveis.
- **PlayStation 1:** integrar via `EJS_core='psx'`, cujo core padrão no EmulatorJS é PCSX-ReARMed. A etapa aceita imagens individuais CHD/PBP/ISO; arquivos CUE/BIN e M3U são multi-arquivo e precisam de seleção de companions, que o seletor atual não implementa. BIOS é opcional em PCSX-ReARMed, mas HLE reduz compatibilidade; apenas BIOS fornecida pelo usuário será usada. Não baixar nem versionar firmware.
- **Dreamcast** não deve ser presumido como coberto pela configuração padrão do EmulatorJS. A pesquisa encontrou `nasomers/flycast-wasm`, uma compilação WebAssembly do Flycast voltada a navegador; precisa de auditoria do repositório, licença, maturidade, origem do build e teste antes de adoção.
- **WebRetro** é outro projeto web baseado em RetroArch/WebAssembly que declara cores para mGBA, Beetle PSX e N64. É alternativa para comparação, não decisão final.

Fontes primárias consultadas:

- [EmulatorJS no GitHub](https://github.com/EmulatorJS/EmulatorJS) — frontend e licença GPL-3.0.
- [Histórico de mudanças do EmulatorJS](https://github.com/EmulatorJS/EmulatorJS/blob/main/CHANGES.md) — versões e mudanças dos cores, incluindo PPSSPP.
- [Cores do EmulatorJS](https://github.com/EmulatorJS/EmulatorJS/tree/main/data/cores) — identificar artefatos e licenças antes de distribuir.
- [Cores e mapeamentos do EmulatorJS](https://emulatorjs.org/docs4devs/cores/) — `psx` usa PCSX-ReARMed por padrão.
- [PCSX-ReARMed — Libretro Docs](https://docs.libretro.com/library/pcsx_rearmed/) — extensões, formatos de disco, BIOS/HLE, saves e compatibilidade do core.
- [Disc Images — Libretro Docs](https://docs.libretro.com/guides/disc-images/) — diferenças entre CUE/BIN, CHD e M3U.
- [BIOS — Libretro Docs](https://docs.libretro.com/guides/bios/) — BIOS não incluídas por Libretro; PCSX-ReARMed aceita uso opcional com fallback HLE.
- [Configuração do Game Boy](https://emulatorjs.org/docs/systems/nintendo-game-boy/) e [GBA](https://emulatorjs.org/docs/systems/nintendo-game-boy-advance/) — valores de sistema/core e BIOS opcional.
- [Opções EmulatorJS](https://emulatorjs.org/docs/options/) — `EJS_fixedSaveInterval` e evento `saveSaveFiles`.
- [Release 4.2.3](https://github.com/EmulatorJS/EmulatorJS/releases/tag/4.2.3) — versão estável fixada no loader.
- [MDN: módulos JavaScript na web](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules/Modules_on_the_web) — `file://` não carrega módulos por CORS; o app agora usa script clássico deferido por não precisar de import/export.
- [MDN: seleção de arquivos](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications) — input entrega ao app um objeto `File` depois da escolha explícita.
- [WebRetro](https://github.com/binbashbanana/webretro) — alternativa WebAssembly e lista declarada de cores.
- [Flycast WASM](https://github.com/nasomers/flycast-wasm) — candidato experimental para Dreamcast no browser.
- [Relato técnico do Flycast WASM](https://github.com/nasomers/flycast-wasm/blob/main/TECHNICAL_WRITEUP.md) — detalhes e limitações do port.

## Salvamentos

O EmulatorJS está configurado para flush do arquivo SRAM a cada 30 segundos (`EJS_fixedSaveInterval`). O upstream monta IDBFS em IndexedDB com persistência local. Isto ainda não fornece backup portável. Save states são recurso separado: snapshots podem ser grandes e incompatíveis entre versões/cores. Exportação/importação manual será implementada após validar o formato/API do motor.

Navegadores móveis podem suspender ou encerrar uma aba sem evento de fechamento confiável. Portanto, salvamento frequente e indicação de “último salvamento” são necessários; `beforeunload` sozinho não é suficiente.

Google Drive fica depois da persistência local. Isso exige OAuth, credenciais de app, tratamento de conflito entre dispositivos, explicação de quais arquivos serão enviados, e revisão de política/escopos. Não há login ou upload remoto nesta versão.

## BIOS / firmware

Não incluir ou baixar BIOS proprietária. Se um core precisar de firmware, a aplicação oferecerá seleção local e manterá os bytes no dispositivo. Quando existir alternativa aberta/HLE embutida no próprio emulador, ela poderá ser usada se o core a suportar e se os testes confirmarem o comportamento; ela não equivale automaticamente a BIOS original nem garante todos os jogos.

## Licenças

Ainda não há código de terceiros incorporado. Antes de adicionar núcleos ou arquivos WebAssembly, registrar URL, versão/tag ou commit, licença do frontend, licença de cada core e dependência, alterações locais e forma de obter o código-fonte correspondente. A licença GPL-3.0 do EmulatorJS afeta a forma de redistribuir versões derivadas/empacotadas; não presumir que basta apontar para um CDN. A decisão de licença raiz do projeto será tomada após a arquitetura de distribuição ficar definida.
