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
  const prop = PropertiesService.getScriptProperties();
  let url = prop.getProperty('WEB_APP_URL');
  if (!url) {
    url = Browser.inputBox('Informe a URL do Web App para testes:');
    if (!url || url === 'cancel') return 'URL do Web App não fornecida.';
    prop.setProperty('WEB_APP_URL', url);
  }
  const now = new Date();
  const iso = Utilities.formatDate(now, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const payload = {
    secret: getSecret_(),
    report: { reportId: 'TEST-'+now.getTime(), runAtISO: iso, windowLabel: '18:00' },
    items: ASSETS.map((sym, i) => ({
      symbol: sym, price: 100+i, open: 99+i, high: 101+i, low: 98+i, close: 100+i,
      var24h: 0.5, var7d: 1.2, var30d: 5.3,
      rsi14: 55, macdLine: 0.2, macdSignal: 0.1, macdHist: 0.1,
      sma20: 100, sma50: 100, sma100: 100, sma200: 100,
      bollMiddle: 100, bollUpper: 102, bollLower: 98, bollWidth: 0.04,
      atr14: 1.2, sarValue: 99.5, sarSide: 'long', volume: 123456, volDivergence: 0,
      trend: 'lateral', recommendation: '🔁 Manter', justification: 'Teste',
      headline: 'Sem notícias', newsUrl: '', fearGreed: 50, contextNotes: 'Demo'
    })),
    // opcional: conteúdo de texto/markdown da tua task
    markdown: "## Exemplo de relatório MD\n\n- BTC: ...\n- ETH: ...\n"
  };
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText());
  return res.getContentText();
}
