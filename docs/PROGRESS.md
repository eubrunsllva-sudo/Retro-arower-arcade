# Registro de progresso

## 2026-11-06 — Etapa 1: base web

### Feito

- Criada interface responsiva em português com estante visual para os seis consoles.
- Adicionado seletor local de arquivo e leitura de nome/tamanho/extensão, sem guardar os bytes da ROM.
- Aviso explícito de que nenhum jogo inicia ainda, evitando apresentar protótipo como emulador funcional.
- Documentados plano por etapas, privacidade inicial, caminhos de saves, limitações móveis e avaliação de candidatos de código aberto.

### Pesquisa e decisão

- EmulatorJS parece candidato abrangente para vários sistemas e possui licença GPL-3.0; ainda precisa auditoria da distribuição de cada core e testes.
- Dreamcast provavelmente requer integração separada; Flycast WASM será avaliado, não assumido como pronto.
- Firmware proprietário não será empacotado nem baixado pelo projeto. BIOS do usuário, quando necessária e legalmente obtida, poderá ser selecionada localmente.

### Falhas / limitações conhecidas

- Nenhum núcleo de emulação foi integrado. A seleção de arquivo é apenas demonstração da camada de entrada.
- A identificação por extensão é ambígua para imagens de disco e formatos compartilhados.
- Não há salvamento funcional, Google Drive, teclado/controle, instalação PWA ou cache offline nesta etapa.
- Não há matriz de teste em dispositivos reais; iOS e consoles mais exigentes continuam sem garantia de compatibilidade.
- Fonte tipográfica remota é carregada pelo Google Fonts no protótipo. Antes de deploy com foco em privacidade/offline, remover ou auto-hospedar essas fontes.

## Próximo passo

Validar e integrar GBC/GBA com um core WebAssembly e um jogo homebrew de teste. Definir o formato de save que o core expõe antes de implementar autosave, para não construir sincronização em cima de uma API incompatível.
