# Compatibilidade — estado inicial

Esta tabela separa alvo de produto e suporte já demonstrado. GBC/GBA têm integração experimental via EmulatorJS; execução em aparelhos reais ainda não está certificada.

| Console | Alvo | Estado nesta etapa | Observações a validar |
|---|---|---|---|
| Game Boy Color | Chrome, Edge, Firefox, Android, iOS | Experimental, não testado em aparelho | ROM `.gb`/`.gbc`; Gambatte via `gb`; SRAM local; controles/áudio/restart ainda precisam teste |
| Game Boy Advance | Chrome, Edge, Firefox, Android, iOS | Experimental, não testado em aparelho | ROM `.gba`; mGBA via `gba`; SRAM local; desempenho/controles/áudio ainda precisam teste |
| Nintendo 64 | Chrome, Edge, Firefox, Android, iOS | Planejado | Desempenho varia por jogo e aparelho; vídeo/WebGL |
| PlayStation | Chrome, Edge, Firefox, Android, iOS | Planejado | Formatos multidisco, firmware e memória |
| Dreamcast | Chrome, Edge, Firefox, Android, iOS | Planejado | Candidato separado Flycast WASM; aparelho pode ser limitante |
| PSP | Chrome, Edge, Firefox, Android, iOS | Planejado | Threads/SharedArrayBuffer e requisitos de hospedagem podem limitar navegadores |

## Acesso a arquivos

O seletor HTML permite escolher arquivos, mas não dá ao site acesso irrestrito ao sistema de arquivos. iOS pode ter experiência de seleção e persistência diferente do Android/desktop. Para GBC/GBA, o arquivo é lido localmente por uma URL temporária e não é enviado. O loader/core é obtido da CDN oficial do EmulatorJS 4.2.3; portanto, a primeira execução exige conexão.

Nesta fase, escolha ROMs sem compactação: `.gb`/`.gbc` para GB/GBC e `.gba` para GBA. Arquivo `.zip` não é classificado pelo seletor atual; extraia-o primeiro e selecione o arquivo `.gba` interno. O cartão removível não muda o tipo do arquivo que o navegador entrega depois da escolha. A documentação oficial do EmulatorJS confirma os identificadores `gb`/Gambatte e `gba`/mGBA; não documenta uma tabela de extensões completa.

O autosave SRAM do EmulatorJS escreve no IndexedDB do navegador. A barra do motor também expõe save/load state e exportação/importação SRAM. Esses comandos ainda não foram verificados em teste de ponta a ponta. Limpeza de dados, quota esgotada ou políticas de armazenamento privado podem remover os saves.

## Classificação futura

- **Testado:** execução repetível em aparelho e navegador informados, com teste identificado.
- **Parcial:** inicia, mas há falhas conhecidas (por exemplo, áudio, desempenho ou salvamento).
- **Não disponível:** núcleo ou recurso não funciona nesse ambiente.

Não publicar alegações como “funciona em qualquer iPhone” sem testar as versões do iOS/Safari e o modo de acesso usado.
