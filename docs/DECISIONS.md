# Decisões técnicas e pesquisa

Atualizado em 2026-11-06. Pesquisa feita em páginas dos projetos e seus repositórios; não foi copiado nem baixado código de terceiros nesta etapa.

## Interface separada dos motores

O app terá uma camada de biblioteca/controles e adaptadores independentes de emulação. Isso permite trocar um core sem refazer salvamento e interface, e evita assumir que um único pacote cobre os seis consoles igualmente. Nesta primeira etapa, a seleção identifica algumas extensões apenas como indicação: `.iso`, `.bin`, `.chd` e `.pbp` são compartilhadas entre sistemas, então extensão não comprova o console nem a validade do conteúdo.

## Candidatos iniciais

- **EmulatorJS** é um frontend web para RetroArch, licenciado GPL-3.0. O projeto lista cores como mGBA, Mupen64Plus-Next e adicionou PPSSPP em suas notas de versão. Pode servir como candidato para GBC/GBA, N64, PS1 e PSP, sujeito a checagem de versão, licença de cada core e teste real em iOS.
- **Dreamcast** não deve ser presumido como coberto pela configuração padrão do EmulatorJS. A pesquisa encontrou `nasomers/flycast-wasm`, uma compilação WebAssembly do Flycast voltada a navegador; precisa de auditoria do repositório, licença, maturidade, origem do build e teste antes de adoção.
- **WebRetro** é outro projeto web baseado em RetroArch/WebAssembly que declara cores para mGBA, Beetle PSX e N64. É alternativa para comparação, não decisão final.

Fontes primárias:

- [EmulatorJS no GitHub](https://github.com/EmulatorJS/EmulatorJS) — frontend e licença GPL-3.0.
- [Histórico de mudanças do EmulatorJS](https://github.com/EmulatorJS/EmulatorJS/blob/main/CHANGES.md) — versões e mudanças dos cores, incluindo PPSSPP.
- [Cores do EmulatorJS](https://github.com/EmulatorJS/EmulatorJS/tree/main/data/cores) — identificar artefatos e licenças antes de distribuir.
- [WebRetro](https://github.com/binbashbanana/webretro) — alternativa WebAssembly e lista declarada de cores.
- [Flycast WASM](https://github.com/nasomers/flycast-wasm) — candidato experimental para Dreamcast no browser.
- [Relato técnico do Flycast WASM](https://github.com/nasomers/flycast-wasm/blob/main/TECHNICAL_WRITEUP.md) — detalhes e limitações do port.

## Salvamentos

O primeiro backend será IndexedDB, pois é assíncrono e comporta arquivos maiores que `localStorage`. O autosave precisa capturar saves SRAM persistentes do core (o progresso gravado pelo próprio jogo), com gravações espaçadas e ao pausar/fechar quando o navegador permitir. Save states são recurso separado: snapshots podem ser grandes e incompatíveis entre versões/cores. A interface oferecerá exportação e importação manual de ambos quando suportados.

Navegadores móveis podem suspender ou encerrar uma aba sem evento de fechamento confiável. Portanto, salvamento frequente e indicação de “último salvamento” são necessários; `beforeunload` sozinho não é suficiente.

Google Drive fica depois da persistência local. Isso exige OAuth, credenciais de app, tratamento de conflito entre dispositivos, explicação de quais arquivos serão enviados, e revisão de política/escopos. Não há login ou upload remoto nesta versão.

## BIOS / firmware

Não incluir ou baixar BIOS proprietária. Se um core precisar de firmware, a aplicação oferecerá seleção local e manterá os bytes no dispositivo. Quando existir alternativa aberta/HLE embutida no próprio emulador, ela poderá ser usada se o core a suportar e se os testes confirmarem o comportamento; ela não equivale automaticamente a BIOS original nem garante todos os jogos.

## Licenças

Ainda não há código de terceiros incorporado. Antes de adicionar núcleos ou arquivos WebAssembly, registrar URL, versão/tag ou commit, licença do frontend, licença de cada core e dependência, alterações locais e forma de obter o código-fonte correspondente. A licença GPL-3.0 do EmulatorJS afeta a forma de redistribuir versões derivadas/empacotadas; não presumir que basta apontar para um CDN. A decisão de licença raiz do projeto será tomada após a arquitetura de distribuição ficar definida.
