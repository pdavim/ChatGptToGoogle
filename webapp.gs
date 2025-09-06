/**
 * Shared routine to POST a sample payload to the configured Web App.
 */
function testWebAppPostImpl_() {
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
  const res = fetchJson_(url, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload)
  });
  Logger.log(res.code + ' ' + res.text);
  return res.text;
}

/** ===== Webhook Audit (verifica secret + campos de texto) ===== */
function ensureWebhookAudit_(){
  const ss = SS_();
  let sh = ss.getSheetByName('WebhookAudit');
  if (!sh) {
    sh = ss.insertSheet('WebhookAudit');
    sh.getRange(1,1,1,8).setValues([[
      'TS_Recebido','ReportId','Janela','Secret_OK','CampoTexto','Chars','TemItens','Msg'
    ]]).setFontWeight('bold');
  }
  return sh;
}
function pickTextFieldName_(body){
  const keys = ['markdown','md','reportMd','markdownReport','textReport'];
  for (let i=0;i<keys.length;i++){
    const k = keys[i];
    if (typeof body?.[k] === 'string' && body[k].length) return k;
  }
  return '';
}
function appendWebhookAudit_(body, gotSecret, msg){
  try {
    const sh = ensureWebhookAudit_();
    const reportId = body?.report?.reportId || '';
    const janela   = body?.report?.windowLabel || '';
    const field    = pickTextFieldName_(body);
    const chars    = field ? String(body[field]).length : 0;
    const temItens = Array.isArray(body?.items) && body.items.length>0;
    sh.appendRow([
      new Date().toISOString(),
      reportId, janela,
      !!gotSecret, field, chars, temItens,
      msg || ''
    ]);
  } catch(e){
    // sem throw: não pode falhar o doPost por causa do audit
    Logger.log('WebhookAudit error: '+e);
  }
}

/* ========================= ENTRYPOINT ========================= */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let gotLock = lock.tryLock(20000);
  if (!gotLock) {
    Utilities.sleep(500);
    gotLock = lock.tryLock(5000);
  }
  if (!gotLock) return json({ ok:false, error:'busy' });
  try {
    ensureSpreadsheetTZ_();
    if (!e || !e.postData || !e.postData.contents) return json({ ok:false, error:'no body' });
    const body = JSON.parse(e.postData.contents);

    // >>> NOVO: auditar sempre (mesmo quando secret está errado)
    const secret = getSecret_();
    const gotSecret = !secret || body.secret === secret;
    appendWebhookAudit_(body, gotSecret, gotSecret ? 'OK' : 'Bad secret');

    if (secret && !gotSecret) return json({ ok:false, error:'unauthorized' });

    const report = body.report || {};
    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) return json({ ok:false, error:'no items' });

    const sheet = getSheet(); ensureHeader(sheet);
    const rows = items.map(i => itemToRow({
      reportId: report.reportId || '', runAtISO: report.runAtISO || '', windowLabel: report.windowLabel || ''
    }, i));
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, HEADERS.length).setValues(rows);

    // opcional: gravar markdown/texto vindo do “task to ChatGPT”
    try { writeMarkdownIfPresent_(body); } catch(e){ Logger.log(e); }

    // Heartbeat
    try { updateHeartbeat_(report); } catch(e){ Logger.log(e); }

    // Infra
    try { ensureRef_();            } catch(e){ Logger.log(e); }
    try { ensureDashboard();       } catch(e){ Logger.log(e); }
    try { ensureSummary();         } catch(e){ Logger.log(e); }

    // Backfill Historico30 (últimos 30 dias com carry-forward)
    try { ensureHistory30();       } catch(e){ Logger.log(e); }

    // Alertas
    try { ensureAlerts();          } catch(e){ Logger.log(e); }
    try { processAlertsStateAndNotify_(report); } catch(e){ Logger.log(e); }

    // Discord (modo 'every' opcional)
    try { maybePushDiscord_(DISCORD_PUSH_MODE, body, report); } catch(e){ Logger.log(e); }

    // AI summary (externally generated via ChatGPT task)
    try { writeAiSummaryIfPresent_(body); } catch(e){ Logger.log(e); }


    // Fiabilidade 30D (heatmap)
    try { ensureReliability30Sheet_(); } catch(e){ Logger.log(e); }

    // Semanal (segunda 08:30) – PDF + sheet
    try { ensureWeeklyScaffold_(); } catch(e){ Logger.log(e); }
    try { maybeGenerateWeekly_(report); } catch(e){ Logger.log(e); }

    return json({ ok:true, added: rows.length });
  } catch (err) {
    return json({ ok:false, error:String(err) });
  } finally {
    if (gotLock) try { lock.releaseLock(); } catch(e){ Logger.log(e); }
  }
}

function writeMarkdownIfPresent_(body){
  try {
    const keys = ['markdown','md','reportMd','markdownReport','textReport'];
    let field = '', text = '';
    for (let k of keys){
      if (typeof body?.[k] === 'string' && body[k].length){
        field = k; text = body[k]; break;
      }
    }
    if (!field) return; // nada para guardar

    const ss = SS_();
    let sh = ss.getSheetByName('RelatoriosMD');
    if (!sh) {
      sh = ss.insertSheet('RelatoriosMD');
      sh.getRange(1,1,1,6).setValues([[
        'TS_Recebido','ReportId','Janela','Campo','Chars','Markdown'
      ]]).setFontWeight('bold');
      sh.setColumnWidths(6,1,800);
    }

    const ts   = body?.report?.runAtISO || new Date().toISOString();
    const id   = body?.report?.reportId || '';
    const win  = body?.report?.windowLabel || '';
    sh.appendRow([ts, id, win, field, text.length, text]);
  } catch(e){
    Logger.log('writeMarkdownIfPresent_ error: ' + e);
  }
}

/* ========================= EXTERNAL AI SUMMARY ========================= */
function writeAiSummaryIfPresent_(body){
  try {
    const keys = ['summary','aiSummary','resumo','textSummary'];
    let text = '';
    for (let k of keys){
      if (typeof body?.[k] === 'string' && body[k].length){
        text = body[k]; break;
      }
    }
    if (!text) return; // nada para guardar

    writeAiSummaryToSheet_(text);
    if (discordWebhookUrl_()) {
      discordPost_({ content: '🤖 Resumo IA:\n' + text.slice(0,1900) });
    }
  } catch(e){
    Logger.log('writeAiSummaryIfPresent_ error: ' + e);
  }

}

function writeAiSummaryToSheet_(text){
  try {
    const ss = SS_();
    const sh = ss.getSheetByName(SUMMARY_SHEET) || ensureSummary();
    sh.getRange('A2').setValue(text).setWrap(true);
  } catch(e){ Logger.log('writeAiSummaryToSheet_ error: ' + e); }
}


