# Plano de desenvolvimento

As etapas podem ser reordenadas se os testes mostrarem incompatibilidade. Cada console só será marcado como funcional depois de uma verificação em navegador e aparelho físico.

1. **Base web (concluída nesta entrega):** interface responsiva, seletor local, documentação inicial e mapa de compatibilidade.
2. **GBC/GBA:** escolher/licenciar núcleos WebAssembly, carregar ROM local, controles táteis/teclado/gamepad, áudio, salvamento automático SRAM e exportação manual.
3. **Persistência e experiência móvel:** IndexedDB resiliente, recuperação de quota, mensagens de erro, continuidade após recarregar e matriz iOS/Android.
4. **PS1 e N64:** integração isolada por adaptador; formatos de discos/cartuchos, necessidade de firmware e desempenho validados por jogo.
5. **Dreamcast:** avaliar Flycast WebAssembly; validar firmware legalmente fornecido ou alternativa HLE suportada, formatos de disco e desempenho móvel.
6. **PSP e nuvem opcional:** avaliar PPSSPP WebAssembly, requisitos de threads/SharedArrayBuffer e iOS; implementar Drive somente com OAuth, consentimento explícito e política de privacidade.
7. **Preparação para GitHub público:** auditoria de licenças e avisos, política de segurança/privacidade, builds reproduzíveis, instruções de deploy e teste de regressão nos navegadores-alvo.

## Critério por console

- Selecionar ROM local sem enviá-la a terceiros.
- O núcleo abre ao menos um homebrew ou arquivo de teste redistribuível legalmente.
- Controles por toque utilizáveis em tela pequena e controles de teclado/gamepad em desktop.
- Áudio, pausa/retomada, salvamento automático e exportação/importação verificados.
- Resultado descrito como **testado**, **parcial** ou **não disponível** por navegador/aparelho; sem alegar compatibilidade irrestrita.
