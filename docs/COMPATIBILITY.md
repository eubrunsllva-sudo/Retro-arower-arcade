# Compatibilidade — estado inicial

Esta tabela separa alvo de produto e suporte já demonstrado. No momento, nenhum console está emulado pelo projeto.

| Console | Alvo | Estado nesta etapa | Observações a validar |
|---|---|---|---|
| Game Boy Color | Chrome, Edge, Firefox, Android, iOS | Planejado | Core, SRAM, controles táteis e áudio |
| Game Boy Advance | Chrome, Edge, Firefox, Android, iOS | Planejado | Core, desempenho e sincronização de áudio |
| Nintendo 64 | Chrome, Edge, Firefox, Android, iOS | Planejado | Desempenho varia por jogo e aparelho; vídeo/WebGL |
| PlayStation | Chrome, Edge, Firefox, Android, iOS | Planejado | Formatos multidisco, firmware e memória |
| Dreamcast | Chrome, Edge, Firefox, Android, iOS | Planejado | Candidato separado Flycast WASM; aparelho pode ser limitante |
| PSP | Chrome, Edge, Firefox, Android, iOS | Planejado | Threads/SharedArrayBuffer e requisitos de hospedagem podem limitar navegadores |

## Acesso a arquivos

O seletor HTML permite o usuário escolher arquivo(s), mas não dá ao site acesso irrestrito ao sistema de arquivos. iOS pode ter experiência de seleção e persistência diferente do Android/desktop. A escolha de ROM neste marco só lê metadados do arquivo; o conteúdo não é enviado nem armazenado.

## Classificação futura

- **Testado:** execução repetível em aparelho e navegador informados, com teste identificado.
- **Parcial:** inicia, mas há falhas conhecidas (por exemplo, áudio, desempenho ou salvamento).
- **Não disponível:** núcleo ou recurso não funciona nesse ambiente.

Não publicar alegações como “funciona em qualquer iPhone” sem testar as versões do iOS/Safari e o modo de acesso usado.
