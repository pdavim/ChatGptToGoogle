/**
 * ActivateAndTest_Menu.gs
 */

const DISCORD_WEBHOOK_MISSING_WARNING = 'Discord notifications disabled: missing webhook URL';

function oneClickActivate_() {
  const messages = [];
  const steps = [
    ensureSpreadsheetTZ_,
    ensureRef_,
    ensureDashboard,
    ensureSummary,
    ensureHistory30,
    ensureReliability30Sheet_,
    ensureAlerts,
    ensureAlertStateSheets_,
    ensureHeartbeat_,
    ensureWeeklyScaffold_,
    setupMonitoringTriggers_,
    setupMaintenanceTriggers_,
    pushDiscordActivationPing_,
    testEmail_
  ];

  steps.forEach(fn => {
    try {
      const result = fn();
      if (result && result.warning) {
        messages.push(`${fn.name}: WARN - ${result.warning}`);
      } else {
        messages.push(`${fn.name}: ${result || 'OK'}`);
      }
    } catch (e) {
      messages.push(`${fn.name}: ERROR - ${e.message}`);
      Logger.log(e);
    }
  });

  messages.push('--- Triggers ---');
  messages.push(listTriggers_());

  return messages.join('\n');
}

function pushDiscordActivationPing_() {
  if (!discordWebhookUrl_()) return { warning: DISCORD_WEBHOOK_MISSING_WARNING };
  const embed = {
    title: '🚀 Cripto Dashboard — Ativação concluída',
    description: 'Triggers ativos (monitor & manutenção). Painel/Resumo/Alertas prontos.',
    url: SHEET_URL,
    color: 0x3498DB,
    fields: [
      { name: 'Monitor', value: 'cada 15 minutos', inline: true },
      { name: 'Manutenção diária', value: '23:55', inline: true }
    ],
    footer: { text: 'Fonte: Google Sheets' },
    timestamp: new Date().toISOString()
  };
  const payload = { embeds: [embed], content: '' };
  discordPost_(payload);
  return 'Ping enviado para Discord.';
}
function testEmail_() {
  const emails = getAlertEmails_();
  if (!emails.length) return 'Sem destinatários.';
  const subject = 'Cripto Dashboard — Teste de ativação';
  const htmlBody = '<h3>✅ Ativação concluída</h3><p>Triggers criados e folhas atualizadas.</p>' +
                   '<p><a href="'+SHEET_URL+'">Abrir Dashboard</a></p>';
  emails.forEach(to => MailApp.sendEmail({ to, subject, htmlBody, noReply: true }));
  return 'E-mail de teste enviado.';
}
function testAllNotifications_() {
  const a = pushDiscordActivationPing_();
  const discordMsg = a && a.warning ? `WARN - ${a.warning}` : a;
  const b = testEmail_();
  return discordMsg + ' | ' + b;
}

// Teste de POST ao Web App com payload fictício
function testWebAppPost_() {
  return testWebAppPostImpl_();
}

function listTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  if (!triggers.length) return 'No project triggers found.';
  return triggers.map(t => {
    const type = String(t.getTriggerSource());
    const handler = t.getHandlerFunction();
    const schedule = String(t.getEventType());
    return `${type} | ${handler} | ${schedule}`;
  }).join('\n');
}
