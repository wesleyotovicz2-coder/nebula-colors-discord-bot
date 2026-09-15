# Nebula Colors — Discloud

Pacote preparado para hospedar o bot no Discloud.

## Como enviar

1. Renomeie `.env.example` para `.env`.
2. Abra `.env` e coloque o token real do bot:

   ```env
   DISCORD_BOT_TOKEN=seu_token_do_bot
   DATA_FILE=./data/guilds.json
   ```

3. Compacte os arquivos do projeto. O arquivo `discloud.config` precisa ficar diretamente na raiz do ZIP, junto de `package.json` e `index.js`.
4. Envie o ZIP pelo painel ou pelo método de upload do Discloud.

O `discloud.config` já define:

- arquivo principal: `index.js`
- tipo: bot
- Node.js: versão mais recente disponível
- memória: 256 MB
- instalação das dependências: `npm install`
- inicialização: `npm start`

Não compartilhe o arquivo `.env` nem o token do bot.

## Depois de iniciar

O console deve mostrar:

```text
FUNKAI Color Bot conectado como ...
[comandos] Registrados no servidor: Nome do servidor (ID)
```

Para os comandos funcionarem, o bot precisa ter sido convidado com os escopos `bot` e `applications.commands`. O cargo dele também precisa ter **Manage Roles**, **Send Messages** e **Embed Links**, ficando acima dos cargos de cores.

## Comandos Slash

- `/painel-menus` mantém o fluxo com menus suspensos.
- `/painel-botoes` envia todas as cores em imagens de até 10 por página, com botões numerados. Se houver 78 cores, serão 8 imagens (7 com 10 e 1 com 8).
- `/cores adicionar` aceita várias cores na mesma chamada, em hexadecimal ou RGB.

Exemplos para o campo `lista`:

```text
Vermelho=#FF0000; Azul=#0000FF; Verde=rgb(0,255,0)
```

Também é possível usar RGB sem a palavra `rgb`:

```text
Preto=0,0,0; Branco=255,255,255
```

O limite de 10 vale para a exibição de cada imagem. Cada categoria ainda pode ter até 25 cores e os cargos são criados automaticamente.

## Comandos

- `/cores editar`, `/cores remover`
- `/cores categoria-criar`, `/cores categoria-editar`, `/cores categoria-remover`