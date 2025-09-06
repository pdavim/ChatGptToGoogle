/* ========================= ALERTAS (RSI/MACD/SMAs) ========================= */
function ensureAlerts() {
  const ss = SS_();
  let sh = ss.getSheetByName(ALERTS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(ALERTS_SHEET);
    buildAlertsLayout_(sh);
    addAlertsFormatting_(sh);
    return;
  }
  const h1 = String(sh.getRange(1,1).getValue() || '');
  const h19 = String(sh.getRange(1,19).getValue() || '');
  if (h1 !== 'Ativo' || h19 !== 'Alertas') {
    buildAlertsLayout_(sh);
    addAlertsFormatting_(sh);
  }
}
function buildAlertsLayout_(sh) {
  const oldN = Number(sh.getRange('S1').getValue()) || 6;
  sh.clear();
  sh.getRange('R1').setValue('JanelaN'); sh.getRange('S1').setValue(oldN);

  const headers = [
    'Ativo','DataHoraÚltimo','RSI14','RSI>70','RSI<30',
    'MACD_Hist','MACD flip ↑','MACD flip ↓',
    'SMA20','SMA50','Golden cross 20/50','Death cross 20/50',
    'Preço','Var24h',
    'RSI cross-back ↓ (70→<70)','RSI cross-back ↑ (<30→>30)',
    'RSI neutral (de >70)','RSI neutral (de <30)',
    'Alertas'
  ];
  sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');

  for (let i=0; i<ASSETS.length; i++) {
  const r = 2+i; sh.getRange(r,1).setValue(ASSETS[i]);

  // Último timestamp (esta já funcionava)
  sh.getRange(r,2).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!B:B)`);

  // RSI atual
  sh.getRange(r,3).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!M:M)`);
  sh.getRange(r,4).setFormula(`=IF($C${r}="",, $C${r}>70)`);
  sh.getRange(r,5).setFormula(`=IF($C${r}="",, $C${r}<30)`);

  // MACD_Hist atual
  sh.getRange(r,6).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!P:P)`);

  // MACD flip ↑ (last>0 & prev<=0)
  sh.getRange(r,7).setFormula(
    `=LET(f,FILTER(${REL}!P:P,${REL}!D:D=$A${r}),n,ROWS(f),IFERROR(AND(INDEX(f,n)>0,INDEX(f,n-1)<=0),FALSE))`
  );

  // MACD flip ↓ (last<0 & prev>=0)
  sh.getRange(r,8).setFormula(
    `=LET(f,FILTER(${REL}!P:P,${REL}!D:D=$A${r}),n,ROWS(f),IFERROR(AND(INDEX(f,n)<0,INDEX(f,n-1)>=0),FALSE))`
  );

  // SMAs atuais
  sh.getRange(r,9).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!Q:Q)`);  // SMA20
  sh.getRange(r,10).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!R:R)`);  // SMA50

  // Golden / Death cross (usa last vs prev)
  sh.getRange(r,11).setFormula(
    `=LET(s20,FILTER(${REL}!Q:Q,${REL}!D:D=$A${r}),s50,FILTER(${REL}!R:R,${REL}!D:D=$A${r}),n,ROWS(s20),IFERROR(AND(INDEX(s20,n)>INDEX(s50,n),INDEX(s20,n-1)<=INDEX(s50,n-1)),FALSE))`
  );

  sh.getRange(r,12).setFormula(
    `=LET(s20,FILTER(${REL}!Q:Q,${REL}!D:D=$A${r}),s50,FILTER(${REL}!R:R,${REL}!D:D=$A${r}),n,ROWS(s20),IFERROR(AND(INDEX(s20,n)<INDEX(s50,n),INDEX(s20,n-1)>=INDEX(s50,n-1)),FALSE))`
  );

  // Preço e Var24h (para contexto na grelha)
  sh.getRange(r,13).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!E:E)`);
  sh.getRange(r,14).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!J:J)`);

  // As fórmulas 15..18 (RSI cross-back/neutral) que tinhas com LET/TAKE já estavam corretas — mantém.
}

  sh.autoResizeColumns(1, 19);
}
function addAlertsFormatting_(sh) {
  sh.clearConditionalFormatRules();
  const rules = [];
  [4,5,7,8,11,12,15,16,17,18].forEach(col => {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .setRanges([sh.getRange(2, col, ASSETS.length, 1)])
      .whenFormulaSatisfied('=INDIRECT(ADDRESS(ROW(),COLUMN()))=TRUE')
      .setBackground('#e6ffe6')
      .build());
  });
  // coluna "Alertas" destacada se não vazia
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .setRanges([sh.getRange(2, 19, ASSETS.length, 1)])
    .whenFormulaSatisfied('=LEN(INDIRECT(ADDRESS(ROW(),COLUMN())))>0')
    .setBackground('#fff9db')
    .build());
  sh.setConditionalFormatRules(rules);
}

/* ========================= ALERTAS: estado + email + DISCORD ========================= */
function ensureAlertStateSheets_() {
  const ss = SS_();
  let st = ss.getSheetByName(ALERT_STATE_SHEET);
  if (!st) {
    st = ss.insertSheet(ALERT_STATE_SHEET);
    st.getRange(1,1,1,12).setValues([[
      'Ativo','RSIgt70','RSIlt30','MACDflipUp','MACDflipDown','Golden','Death','RSIcbDown','RSIcbUp','RSIneuFromHigh','RSIneuFromLow','LastTS'
    ]]).setFontWeight('bold');
    for (let i=0;i<ASSETS.length;i++) st.getRange(2+i,1).setValue(ASSETS[i]);
  }
  let log = ss.getSheetByName(ALERT_LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(ALERT_LOG_SHEET);
    log.getRange(1,1,1,6).setValues([['Timestamp','Ativo','Trigger','NovoEstado','DataHoraRelatorio','JanelaN']]).setFontWeight('bold');
  }
}
function readCurrentAlerts_() {
  const ss = SS_();
  const sh = ss.getSheetByName(ALERTS_SHEET);
  const rng = sh.getRange(2,1,ASSETS.length,19).getValues();
  const N = sh.getRange('S1').getValue() || 6;
  const map = {};
  rng.forEach(row=>{
    const [sym, ts, _rsi,
      rsi70, rsi30,
      _macdH, macdUp, macdDn,
      _sma20, _sma50, golden, death,
      _p, _v,
      cbDown, cbUp, neuHigh, neuLow] = row;
    map[sym] = {
      ts: ts || '', rsi70: !!rsi70, rsi30: !!rsi30,
      macdUp: !!macdUp, macdDn: !!macdDn, golden: !!golden, death: !!death,
      cbDown: !!cbDown, cbUp: !!cbUp, neuHigh: !!neuHigh, neuLow: !!neuLow, N
    };
  });
  return map;
}
function readPrevAlerts_() {
  const ss = SS_();
  const st = ss.getSheetByName(ALERT_STATE_SHEET);
  const vals = st.getRange(2,1,ASSETS.length,12).getValues();
  const map = {};
  vals.forEach(row=>{
    const [sym, r70, r30, up, dn, g, d, cbD, cbU, nH, nL, lastts] = row;
    map[sym] = { rsi70: !!r70, rsi30: !!r30, macdUp: !!up, macdDn: !!dn, golden: !!g, death: !!d, cbDown: !!cbD, cbUp: !!cbU, neuHigh: !!nH, neuLow: !!nL, ts: lastts || '' };
  });
  return map;
}
function writePrevAlerts_(cur) {
  const ss = SS_();
  const st = ss.getSheetByName(ALERT_STATE_SHEET);
  const rows = ASSETS.map(sym => [
    sym,
    cur[sym]?.rsi70||false, cur[sym]?.rsi30||false,
    cur[sym]?.macdUp||false, cur[sym]?.macdDn||false,
    cur[sym]?.golden||false, cur[sym]?.death||false,
    cur[sym]?.cbDown||false, cur[sym]?.cbUp||false,
    cur[sym]?.neuHigh||false, cur[sym]?.neuLow||false,
    cur[sym]?.ts||''
  ]);
  st.getRange(2,1,ASSETS.length,12).setValues(rows);
}
function appendAlertLog_(changes, reportTS, N) {
  const ss = SS_();
  const log = ss.getSheetByName(ALERT_LOG_SHEET);
  const now = new Date();
  const rows = changes.map(ch => [now, ch.sym, ch.trigger, ch.newState ? 'ON' : 'OFF', reportTS || '', N]);
  if (rows.length) log.getRange(log.getLastRow()+1,1,rows.length,6).setValues(rows);
}
function processAlertsStateAndNotify_(report) {
  ensureAlertStateSheets_();
  const cur = readCurrentAlerts_();
  const prev = readPrevAlerts_();

  const changes = [];
  ASSETS.forEach(sym=>{
    const c = cur[sym]||{}, p = prev[sym]||{};
    [
      ['rsi70','RSI>70'],
      ['rsi30','RSI<30'],
      ['macdUp','MACD flip ↑'],
      ['macdDn','MACD flip ↓'],
      ['golden','Golden cross 20/50'],
      ['death','Death cross 20/50'],
      ['cbDown','RSI cross-back ↓ (70→<70)'],
      ['cbUp','RSI cross-back ↑ (<30→>30)'],
      ['neuHigh','RSI neutral (de >70)'],
      ['neuLow','RSI neutral (de <30)']
    ].forEach(([key,label])=>{
      if ((!!c[key]) !== (!!p[key])) changes.push({sym, trigger: label, newState: !!c[key], N: c.N});
    });
  });

  if (changes.length) {
    sendAlertEmail_(changes, cur, report);
    appendAlertLog_(changes, report?.runAtISO || '', changes[0]?.N || 6);
    writePrevAlerts_(cur);
    if (discordWebhookUrl_()) pushToDiscordEmbedChanges_(changes, report);
  } else {
    writePrevAlerts_(cur);
  }
}
function sendAlertEmail_(changes, cur, report) {
  const ts = report?.runAtISO || new Date().toISOString();
  const titleTs = Utilities.formatDate(new Date(ts), APP_TZ, 'yyyy-MM-dd HH:mm');

  const bySym = {};
  changes.forEach(ch => { (bySym[ch.sym] = bySym[ch.sym] || []).push(ch); });

  let html = `<h3>🚨 Alertas de Trading — ${titleTs}</h3><p>Mudanças de estado:</p><ul>`;
  Object.keys(bySym).forEach(sym=>{
    html += `<li><b>${sym}</b><ul>`;
    bySym[sym].forEach(ch=>{ html += `<li>${ch.trigger}: <b>${ch.newState ? 'ON' : 'OFF'}</b></li>`; });
    html += `</ul></li>`;
  });
  html += `</ul><p style="font-size:12px;color:#888">Janela RSI: ${changes[0]?.N || 6} • Fonte: Sheets</p>`;

  const subject = `Alertas Cripto — ${titleTs}`;
  getAlertEmails_().forEach(to=> MailApp.sendEmail({ to, subject, htmlBody: html, noReply: true }));
}

