# Read Me

## Configuração

Alguns valores sensíveis não são mais definidos no código fonte e devem ser
armazenados nas *Script Properties* do projeto Apps Script.

Propriedades esperadas:

- `SECRET` – segredo compartilhado usado para autorizar chamadas ao webhook.
- `DISCORD_WEBHOOK_URL` – URL do webhook do Discord para envio de notificações.
- `DISCORD_ERROR_WEBHOOK_URL` – webhook opcional para alertas quando o envio falhar.
- `ALERT_EMAILS` – lista de e-mails separados por vírgula que receberão alertas.

As propriedades podem ser definidas manualmente em **Project Settings → Script
properties**, ou programaticamente executando uma função como a abaixo uma vez:

```javascript
function initProps_() {
  PropertiesService.getScriptProperties().setProperties({
    SECRET: 'minha-senha',
    DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/...',
    DISCORD_ERROR_WEBHOOK_URL: 'https://discord.com/api/webhooks/erro...',
    ALERT_EMAILS: 'user@example.com,other@example.com'
  });
}
```

Execute `initProps_` no editor do Apps Script ou ajuste os valores pela
interface antes de implantar o projeto.
