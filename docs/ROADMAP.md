# Plano de desenvolvimento

As etapas podem ser reordenadas se os testes mostrarem incompatibilidade. Cada console só será marcado como funcional depois de uma verificação em navegador e aparelho físico.

1. **Base web (concluída):** interface responsiva, seletor local, documentação inicial e mapa de compatibilidade.
2. **GBC/GBA (integração experimental):** loader EmulatorJS 4.2.3, ROM local e autosave SRAM no navegador. Falta validar ROM homebrew, controles, áudio, exportação/importação manual e navegadores/dispositivos.
3. **PS1 (integração experimental):** PCSX-ReARMed com imagens `.chd`, `.pbp` e `.iso`, além de conjuntos CUE/BIN e M3U por seleção múltipla/pasta. BIOS própria opcional; sem ela o core recorre a HLE. Falta testar ROM legal em browsers/aparelhos e confirmar troca de disco, cartão de memória e autosave.
4. **Persistência e experiência móvel:** IndexedDB resiliente, recuperação de quota, mensagens de erro, continuidade após recarregar e matriz iOS/Android.
5. **Nintendo 64:** integrar núcleo compatível e validar formatos, controles, saves e desempenho por aparelho.
6. **Dreamcast:** avaliar Flycast WebAssembly; validar firmware legalmente fornecido ou alternativa HLE suportada, formatos de disco e desempenho móvel.
7. **PSP e nuvem opcional:** avaliar PPSSPP WebAssembly, requisitos de threads/SharedArrayBuffer e iOS; implementar Drive somente com OAuth, consentimento explícito e política de privacidade.
8. **Preparação para GitHub público:** auditoria de licenças e avisos, política de segurança/privacidade, builds reproduzíveis, instruções de deploy e teste de regressão nos navegadores-alvo.

## Critério por console

- Selecionar ROM local sem enviá-la a terceiros.
- O núcleo abre ao menos um homebrew ou arquivo de teste redistribuível legalmente.
- Controles por toque utilizáveis em tela pequena e controles de teclado/gamepad em desktop.
- Áudio, pausa/retomada, salvamento automático e exportação/importação verificados.
- Resultado descrito como **testado**, **parcial** ou **não disponível** por navegador/aparelho; sem alegar compatibilidade irrestrita.
