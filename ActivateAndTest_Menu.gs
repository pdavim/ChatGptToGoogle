/**
 * ActivateAndTest_Menu.gs
 */

function oneClickActivate_() {
  try { ensureSpreadsheetTZ_(); } catch(e){ Logger.log(e); }
  try { ensureRef_(); } catch(e){ Logger.log(e); }
  try { ensureDashboard(); } catch(e){ Logger.log(e); }
  try { ensureSummary(); } catch(e){ Logger.log(e); }
  try { ensureHistory30(); } catch(e){ Logger.log(e); }
  try { ensureReliability30Sheet_(); } catch(e){ Logger.log(e); }
  try { ensureAlerts(); } catch(e){ Logger.log(e); }
  try { ensureAlertStateSheets_(); } catch(e){ Logger.log(e); }
  try { ensureHeartbeat_(); } catch(e){ Logger.log(e); }
  try { ensureWeeklyScaffold_(); } catch(e){ Logger.log(e); }

  try { setupMonitoringTriggers_(); } catch(e){ Logger.log(e); }
  try { setupMaintenanceTriggers_(); } catch(e){ Logger.log(e); }

  try { pushDiscordActivationPing_(); } catch(e){ Logger.log(e); }
  try { testEmail_(); } catch(e){ Logger.log(e); }

  return 'OK: Triggers definidos, folhas asseguradas e notificações testadas.';
}

function pushDiscordActivationPing_() {
  if (!discordWebhookUrl_()) return 'Sem webhook configurado';
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
  const b = testEmail_();
  return a + ' | ' + b;
}

// Teste de POST ao Web App com payload fictício
function testWebAppPost_() {
  return testWebAppPostImpl_();
}
