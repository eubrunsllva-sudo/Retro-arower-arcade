# Acessar ROMs no Google Drive

## O que a integração faz

A opção **Escolher ROM no Google Drive** abre o seletor oficial do Google. Depois da autorização, o usuário escolhe os arquivos que deseja abrir. O app solicita acesso apenas aos itens escolhidos (`drive.file`), lê o conteúdo pela Drive API e o mantém temporariamente na memória da aba para entregar ao EmulatorJS como um arquivo local de sessão. Nenhum arquivo é gravado no aparelho, enviado a um servidor deste projeto ou publicado no repositório.

O navegador ainda recebe os bytes da ROM pela rede e mantém dados na memória durante a emulação; esta integração elimina a etapa de baixar/salvar manualmente a ROM no armazenamento do aparelho, não o tráfego nem o uso de RAM. Arquivos PS1 grandes podem exceder a memória disponível, especialmente no iPhone. CUE/BIN exige selecionar o CUE e todos os BIN referenciados no mesmo Picker; M3U requer as listas e imagens relacionadas.

GBC, GBA e PS1 são os consoles ativos que a integração reconhece nesta etapa. Os demais continuam planejados. A emulação ainda ocorre no próprio navegador.

## Criar as credenciais

A integração no front-end precisa de identificadores do Google Cloud do proprietário do site. Eles não são senhas e não existe Client Secret no código do navegador.

1. No [Google Cloud Console](https://console.cloud.google.com/), crie ou selecione um projeto.
2. Ative **Google Drive API** e **Google Picker API** em APIs e serviços.
3. Configure a tela de consentimento OAuth. Para uso próprio, deixe o app em modo de teste e adicione a sua conta Google como usuário de teste.
4. Crie um OAuth Client ID do tipo **Web application**. Em **Authorized JavaScript origins**, adicione:
   - `https://eubrunsllva-sudo.github.io`
   - `http://localhost:8000` para desenvolvimento local
5. Crie uma chave de API. Restrinja-a a sites (`https://eubrunsllva-sudo.github.io/*`, `https://docs.google.com/*` e, se necessário, `http://localhost:8000/*`) e às APIs Google Drive e Google Picker.
6. Copie o **Client ID**, a **API key** e o **Project number**. O número do projeto é diferente do nome/ID textual do projeto.
7. Abra **Configurar acesso ao Google Drive** no app, cole esses três valores e toque em **Salvar configuração**. Depois toque em **Escolher ROM no Google Drive**, autorize a conta e escolha o jogo.

O OAuth do app usa apenas o escopo `https://www.googleapis.com/auth/drive.file`. O Picker recebe o token de acesso e o identificador do projeto. Restrinja a chave conforme a [documentação oficial do Picker para web](https://developers.google.com/workspace/drive/picker/guides/web-picker) e configure a autorização conforme o [guia de OAuth para aplicações web](https://developers.google.com/identity/oauth2/web/guides/overview).

## Dados e privacidade

- Client ID, API key e número do projeto ficam no `localStorage` deste navegador, para você não precisar digitá-los em cada visita. A chave API deve ter restrições de origem e de APIs no Google Cloud.
- O token OAuth fica apenas na memória da aba e não é colocado em `localStorage`.
- O app acessa o conteúdo do arquivo escolhido via `files.get?alt=media`, conforme a [documentação de download da Drive API](https://developers.google.com/workspace/drive/api/guides/manage-downloads).
- **Limpar sessão** remove o token de acesso mantido nesta aba; a configuração de identificadores continua salva neste navegador.
- Ao fechar ou recarregar a aba, os objetos temporários de arquivo e o token em memória são descartados pelo navegador.

## Limites desta branch

- A integração requer configurar um projeto Google Cloud; este repositório não contém credenciais de OAuth/API de terceiros.
- O teste real de autorização, Picker e leitura depende de credenciais próprias, conta de teste autorizada e uso do site em HTTPS ou `localhost`.
- GitHub Pages não é um servidor de emulação; apenas hospeda o front-end estático. O core continua executando localmente no dispositivo.
- Selecionar muitos arquivos PS1 ou uma imagem grande pode consumir muita memória. Para CUE, selecione apenas o CUE e seus arquivos necessários. No iOS, considere imagens menores e valide no aparelho.