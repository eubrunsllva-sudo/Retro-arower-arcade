# Conectar o Google Drive

## Como o fluxo funciona

1. A pessoa toca em **Escolher ROM no Google Drive**.
2. O Google abre a janela oficial para escolher a conta e autorizar acesso.
3. O app solicita somente o escopo https://www.googleapis.com/auth/drive.file, recomendado pelo Google para acesso por arquivo. O seletor oficial entrega ao app somente os arquivos escolhidos.
4. O navegador envia o código OAuth de uso único à função do Cloudflare Pages. A função troca esse código por um token temporário usando o Client Secret armazenado como segredo no Cloudflare.
5. O token fica somente na memória da aba e é usado para ler os arquivos escolhidos pela Drive API. Ao encerrar ou recarregar a sessão, ele é descartado; não armazenamos refresh tokens nem ROMs no servidor.

A ROM é transferida do Google Drive para a memória do navegador para a emulação. Isso não elimina o tráfego de rede nem o consumo de memória; arquivos PS1 grandes podem exceder os limites do iPhone/iPad. CUE/BIN exige selecionar juntos o CUE e todos os BIN citados; para M3U, selecione também os discos correspondentes.

## O que nunca colocar no código ou enviar pelo chat

- **Client Secret**: segredo confidencial. Cadastre somente em Cloudflare Pages como secret. Não o inclua em arquivos, commits, mensagens ou capturas de tela.
- Client ID, número do projeto e API key são identificadores públicos, mas a API key precisa de restrições por origem e por API no Google Cloud.
- O app nunca pede a senha Google. Digite a senha somente na página oficial accounts.google.com.

## Configurar Google Cloud

Crie um projeto dedicado chamado, por exemplo, **Retro Arcade**. Não use o projeto de outro aplicativo.

1. Ative **Google Drive API** e **Google Picker API** em APIs e serviços.
2. Configure a tela de consentimento OAuth com o nome e o domínio do Retro Arcade. Para validar primeiro com sua conta, deixe o público como **External** e o status de publicação em **Testing**; adicione o endereço da sua conta como usuário de teste.
3. Crie credenciais OAuth do tipo **Web application**.
4. Em **Authorized JavaScript origins**, cadastre exatamente:
   - https://retroarcade.xyz.br
   - http://localhost:8000 somente para desenvolvimento local.
   
   O fluxo popup usa a origem da página como redirect URI; não é necessário cadastrar um redirect path. Se testar uma prévia pages.dev, cadastre a origem exata dessa prévia também e remova-a ao terminar.
5. Crie uma API key e restrinja-a a **Websites/HTTP referrers**. Autorize somente https://retroarcade.xyz.br/*, https://docs.google.com/* (se exigido pelo Picker) e http://localhost:8000/* para desenvolvimento. Restrinja também as APIs à Drive API e Picker API.
6. Anote o OAuth Client ID, a API key, o número numérico do projeto e o Client Secret. Não confunda o número com o nome/ID textual do projeto.

O escopo drive.file é não sensível e mais restrito que acesso total ao Drive. A verificação de marca/domínio do Google ainda pode ser necessária antes de abrir o app ao público. Manter o app em Testing com sua conta cadastrada serve para validar o uso pessoal, mas não equivale à aprovação pública do Google.

## Configurar Cloudflare Pages

No painel Cloudflare: **Workers e Pages → retro-arower-arcade → Settings → Variables and Secrets**. Configure no ambiente **Production**:

| Nome | Tipo | Valor |
| --- | --- | --- |
| GOOGLE_CLIENT_ID | Variable | OAuth Client ID do app Web |
| GOOGLE_API_KEY | Variable | API key restrita |
| GOOGLE_PROJECT_NUMBER | Variable | número numérico do projeto Google Cloud |
| GOOGLE_CLIENT_SECRET | Secret | Client Secret do app Web |

Salve e publique/reimplante a implantação. Para prévias de branch, configure os valores também no ambiente **Preview**, usando uma origem OAuth autorizada para a URL de prévia. O endpoint /api/google/config publica somente os três identificadores públicos; nunca retorna o Client Secret. O endpoint /api/google/token só aceita POST da própria origem do site, exige o cabeçalho anti-CSRF usado no popup GIS e não grava tokens.

## Verificação ponta a ponta

Depois de publicar uma versão que inclui functions/api/google/:

1. Abra https://retroarcade.xyz.br e confirme que o status Google diz **Pronto**.
2. Toque em **Escolher ROM no Google Drive**, escolha sua conta no domínio oficial do Google e autorize.
3. Selecione primeiro um arquivo pequeno e legítimo do seu Drive com extensão GBC/GBA para validar o fluxo.
4. Confira que o jogo aparece selecionado e inicia. O arquivo permanece apenas na memória do navegador.
5. Use **Limpar sessão do Google** para descartar o token em memória. A permissão concedida também pode ser revogada em [Segurança da Conta Google → conexões com terceiros](https://myaccount.google.com/connections).

Se aparecer erro, registre apenas a mensagem e o código (por exemplo origin_mismatch, access_denied, HTTP 403). Nunca compartilhe tokens, Client Secret ou o conteúdo de uma ROM.

## Fontes oficiais

- [Google Identity Services: fluxo de código para aplicações web](https://developers.google.com/identity/oauth2/web/guides/use-code-model)
- [Escolher escopos da Drive API](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Google Picker para a Web](https://developers.google.com/workspace/drive/picker/guides/web-picker)
- [Políticas OAuth do Google](https://developers.google.com/identity/protocols/oauth2/policies)
