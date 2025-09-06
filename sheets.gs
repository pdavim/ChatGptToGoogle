/* ========================= PAINEL ========================= */
function ensureDashboard() {
  const ss = SS_();
  let sh = ss.getSheetByName(DASHBOARD_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DASHBOARD_SHEET);
    buildDashboardLayout_(sh);
    addTrafficLightFormatting_(sh);
  } else if (sh.getLastRow() < 2) {
    buildDashboardLayout_(sh);
    addTrafficLightFormatting_(sh);
  }
}
function buildDashboardLayout_(sh) {
  sh.clear();
  const headers = [
    'Ativo','Preço','Var24h','Var7d','Var30d',
    'RSI14','MACD_Hist','SMA20','SMA50','SMA100','SMA200',
    'BollWidth','ATR14','Volume','FearGreed',
    'Tendência','Recomendação','Semáforo','Score','Preço (sparkline)'
  ];
  sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');

  for (let i=0; i<ASSETS.length; i++) {
  const r = 2+i;
  sh.getRange(r,1).setValue(ASSETS[i]);

  // Preço / Variações
  sh.getRange(r,2).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!E:E)`);
  sh.getRange(r,3).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!J:J)`);
  sh.getRange(r,4).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!K:K)`);
  sh.getRange(r,5).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!L:L)`);

  // Indicadores
  sh.getRange(r,6).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!M:M)`);
  // RSI
  sh.getRange(r,7).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!P:P)`);
  // MACD_Hist
  sh.getRange(r,8).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!Q:Q)`);
  // SMA20
  sh.getRange(r,9).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!R:R)`);
  // SMA50
  sh.getRange(r,10).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!S:S)`);
  // SMA100
  sh.getRange(r,11).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!T:T)`);
  // SMA200
  sh.getRange(r,12).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!X:X)`);
  // BollWidth
  sh.getRange(r,13).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!Y:Y)`);
  // ATR14
  sh.getRange(r,14).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!AB:AB)`);
  // Volume
  sh.getRange(r,15).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!AI:AI)`);
  // FearGreed

  // Tendência / Recomendação
  sh.getRange(r,16).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!AD:AD)`);
  sh.getRange(r,17).setFormula(`=LOOKUP(2,1/(${REL}!D:D=$A${r}),${REL}!AE:AE)`);

  // Semáforo (R) e Score (S) — mantém como tinhas
  sh.getRange(r,19).setFormula(`=ROUND(
    IF($P${r}="alta",20,IF($P${r}="baixa",-20,0)) +
    IF($G${r}>0,10,IF($G${r}<0,-10,0)) +
    IF($F${r}>=70,-5,IF($F${r}>=60,10,IF($F${r}<=30,10,IF($F${r}<=40,-10,0)))) +
    (IF($B${r}>$H${r},5,-5) + IF($B${r}>$I${r},5,-5) + IF($B${r}>$J${r},5,-5) + IF($B${r}>$K${r},5,-5)) +
    IF($O${r}>=70,-5,IF($O${r}<=30,5,0)) +
    IF($L${r}<0.03,2,0) +
    IF($C${r}>0,2,IF($C${r}<0,-2,0))
  )`);
  sh.getRange(r,18).setFormula(`=IFS($S${r}>=20,"🟢",$S${r}>=5,"🟡",TRUE,"🔴")`);

  // Sparkline — extrai série de preços sem reordenar
  sh.getRange(r,20).setFormula(`=SPARKLINE(
    FILTER(${REL}!I:I,${REL}!D:D=$A${r}),
    {"charttype","line";"linewidth",2}
  )`);
}

  sh.autoResizeColumns(1, 20);
}
function addTrafficLightFormatting_(sh) {
  const lastRow = Math.max(2, 1 + ASSETS.length);
  const semCol = 18, scoreCol = 19;
  sh.clearConditionalFormatRules();
  const rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .setRanges([sh.getRange(2,semCol,lastRow-1,1), sh.getRange(2,scoreCol,lastRow-1,1)])
    .whenFormulaSatisfied(`=$S2>=20`).setBackground('#e6ffe6').build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .setRanges([sh.getRange(2,semCol,lastRow-1,1), sh.getRange(2,scoreCol,lastRow-1,1)])
    .whenFormulaSatisfied(`=AND($S2>=5,$S2<20)`).setBackground('#fff7e6').build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .setRanges([sh.getRange(2,semCol,lastRow-1,1), sh.getRange(2,scoreCol,lastRow-1,1)])
    .whenFormulaSatisfied(`=$S2<5`).setBackground('#ffe6e6').build());
  sh.setConditionalFormatRules(rules);
}

/* ========================= RESUMO ========================= */
function ensureSummary() {
  const ss = SS_();
  let sh = ss.getSheetByName(SUMMARY_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SUMMARY_SHEET);
    buildSummaryLayout_(sh);
    buildSummaryCharts_(sh);
  } else if (sh.getLastRow() < 10) {
    buildSummaryLayout_(sh);
    buildSummaryCharts_(sh);
  } else {
    refreshSummaryCharts_(sh);
  }
}
function buildSummaryLayout_(sh) {
  sh.clear();
  sh.getRange('A1').setValue('📊 Resumo Diário — Cripto Dashboard')
    .setFontWeight('bold').setFontSize(14);

  // ========== Execuções hoje (usa WINDOWS global) ==========
  sh.getRange('F2').setValue('Execuções hoje').setFontWeight('bold');
  sh.getRange('G2').setValue('Registos').setFontWeight('bold');
  sh.getRange('H2').setValue('Status').setFontWeight('bold');

  const expCount = `COUNTA(${PAN}!A2:A)`;
  WINDOWS.forEach((w,i)=>{
    const r = 3+i;
    sh.getRange(r,6).setValue(w.label); // F
    sh.getRange(r,7).setFormula(
      `=COUNTIFS(${REL}!B:B,">="&TODAY(), ${REL}!B:B,"<"&TODAY()+1, ${REL}!C:C,"${w.label}", ${REL}!D:D,"<>")`
    ); // G
    sh.getRange(r,8).setFormula(`=IF(G${r}=${expCount},"OK","⚠️")`); // H
  });

  // ========== KPI básicos ==========
  sh.getRange('A3').setValue('Data/Hora último relatório');
  sh.getRange('B3').setFormula(`=LOOKUP(2,1/(${REL}!B:B<>""),${REL}!B:B)`);
  sh.getRange('A4').setValue('Média Score (Painel)');
  sh.getRange('B4').setFormula(`=AVERAGE(${PAN}!S2:S)`);
  sh.getRange('A5').setValue('Semáforos (🟢 / 🟡 / 🔴)');
  sh.getRange('B5').setFormula(`=COUNTIF(${PAN}!R2:R,"🟢")`);
  sh.getRange('C5').setFormula(`=COUNTIF(${PAN}!R2:R,"🟡")`);
  sh.getRange('D5').setFormula(`=COUNTIF(${PAN}!R2:R,"🔴")`);
  sh.getRange('A6').setValue('Top Ativo por Score');
  sh.getRange('B6').setFormula(`=INDEX(${PAN}!A2:A, MATCH(MAX(${PAN}!S2:S), ${PAN}!S2:S, 0))`);
  sh.getRange('C6').setFormula(`=MAX(${PAN}!S2:S)`);

  // ========== Semáforo global ==========
  sh.getRange('A8').setValue('Semáforo Global (Score ponderado)');
  sh.getRange('B8').setFormula(`=
    LET(
      assets, FILTER(${PAN}!A2:A, ${PAN}!A2:A<>""),
      scores, FILTER(${PAN}!S2:S, ${PAN}!A2:A<>""),
      vols,   FILTER(${PAN}!N2:N, ${PAN}!A2:A<>""),
      customW, IFNA(VLOOKUP(assets, ${RES}!B16:C, 2, FALSE), ""),
      capW,    IFNA(VLOOKUP(assets, ${REF}!A:B, 2, FALSE), ""),
      weights, IF(LEN(customW), customW, IF(LEN(capW), capW, vols)),
      IF(SUM(weights)=0, AVERAGE(scores), SUMPRODUCT(scores, weights)/SUM(weights))
    )`);
  sh.getRange('C8').setFormula(`=IFS($B8>=20,"🟢",$B8>=5,"🟡",TRUE,"🔴")`);

  // ========== URL WordPress (futuro) ==========
  sh.getRange('A7').setValue('URL Último Post (WordPress)');
  sh.getRange('D7').setFormula(`=IF(B7<>"",HYPERLINK(B7,"Abrir post"),"")`);

  // ========== Pesos custom ==========
  sh.getRange('B15').setValue('Pesos custom (Asset / Weight)');
  ['BTC','ETH','SOL','TRX','POL','SUI'].forEach((a,i)=>{ sh.getRange(16+i,2).setValue(a); });

  // ========== Tabela auxiliar ==========
  sh.getRange('A10').setValue('Verde');   sh.getRange('B10').setFormula(`=B5`);
  sh.getRange('A11').setValue('Amarelo'); sh.getRange('B11').setFormula(`=C5`);
  sh.getRange('A12').setValue('Vermelho');sh.getRange('B12').setFormula(`=D5`);

  // Nota
  sh.getRange('A14').setValue('Fonte: Relatorios & Painel (janelas dinâmicas)')
    .setFontStyle('italic');

  // Último PDF semanal (link)
  sh.getRange('E3').setValue('Último PDF Semanal');
  sh.getRange('F3').setFormula(
    `=IFERROR(HYPERLINK(LOOKUP(2,1/(${SEMLOG}!B:B<>""),${SEMLOG}!B:B),"Abrir último PDF"),"")`
  );

  // Fiabilidade 7D (sparkline) — igual ao teu, só que mantém
  sh.getRange('E5').setValue('Fiabilidade 7D (janelas OK/total)');
  sh.getRange('F10').setFormula(`=SEQUENCE(7,1,TODAY()-6,1)`);
  sh.getRange('F10:F16').setNumberFormat('yyyy-mm-dd');
  sh.getRange('G9').setValue('Sucessos (0–N)');
  sh.getRange('H9').setValue('% Sucesso');
  // Para simplicidade, mantemos a versão anterior com 4 janelas, mas funciona como amostra
  sh.getRange('G10').setFormula(`=ARRAYFORMULA(
    N(COUNTIFS(${REL}!B:B,">="&F10:F16, ${REL}!B:B,"<"&F10:F16+1, ${REL}!D:D,"<>")>=COUNTA(${PAN}!A2:A))
  )`);
  sh.getRange('H10').setFormula(`=ARRAYFORMULA(IF(G10:G16="",,G10:G16/1))`);
  sh.getRange('H10:H16').setNumberFormat('0%');
  sh.getRange('E6').setValue('Média 7D (%)');
  sh.getRange('F6').setFormula('=AVERAGE(H10:H16)');
  sh.getRange('F6').setNumberFormat('0%');
  sh.getRange('E7').setValue('Dias com 100% (7D)');
  sh.getRange('F7').setFormula('=COUNTIF(H10:H16,">=0.9999")&" / 7"');

  // MM 30D (com Fiabilidade30)
  sh.getRange('E9').setValue('MM 30D (%)');
  sh.getRange('F9').setFormula(`=IFERROR(AVERAGE(${F30}!G2:INDEX(${F30}!G:G, 1+COUNTA(${F30}!A2:A))),"")`);
  sh.getRange('F9').setNumberFormat('0.00%');
  sh.getRange('E10').setValue('Tendência (MM30D)');
  sh.getRange('F10').setFormula('=IFS(F9>=0.9,"🟢",F9>=0.75,"🟡",TRUE,"🔴")');

  sh.autoResizeColumns(1, 12);
}
function buildSummaryCharts_(sh) {
  const ss = sh.getParent(); sh.getCharts().forEach(c => sh.removeChart(c));
  const painel = ss.getSheetByName(DASHBOARD_SHEET);
  const last = Math.max(painel.getLastRow(), 2);

  const bar = sh.newChart().asColumnChart()
    .addRange(painel.getRange(1,1,last,1))
    .addRange(painel.getRange(1,19,last,1))
    .setOption('title', 'Score por Ativo (último relatório)')
    .setOption('legend', { position: 'none' })
    .setPosition(16, 1, 0, 0).build();
  sh.insertChart(bar);

  const pie = sh.newChart().asPieChart()
    .addRange(sh.getRange('A10:B12'))
    .setOption('title', 'Distribuição de Semáforos')
    .setOption('pieHole', 0.35)
    .setPosition(16, 8, 0, 0).build();
  sh.insertChart(pie);

  ensureHistory30();
  const line = sh.newChart().asLineChart()
    .addRange(ss.getSheetByName(HISTORY_SHEET).getRange('A1:G200'))
    .setOption('title', 'Closes — últimos 30 registos (multi-série)')
    .setOption('legend', { position: 'right' })
    .setPosition(33, 1, 0, 0).build();
  sh.insertChart(line);
}
function refreshSummaryCharts_(sh){ buildSummaryCharts_(sh); }

/* ========================= REF ========================= */
function ensureRef_(){
  const ss = SS_();
  let sh = ss.getSheetByName(REF_SHEET);
  if (!sh) {
    sh = ss.insertSheet(REF_SHEET);
    sh.getRange(1,1,1,2).setValues([['Asset','MarketCapWeight']]).setFontWeight('bold');
    ASSETS.forEach((a,i)=> sh.getRange(2+i,1,1,2).setValues([[a,'']]));
    sh.autoResizeColumns(1,2);
  }
}
function ensureWeeklyScaffold_(){
  const ss = SS_();
  let s = ss.getSheetByName(WEEKLY_SHEET);
  if (!s) {
    s = ss.insertSheet(WEEKLY_SHEET);
    s.getRange(1,1).setValue('📅 Semana');
    s.getRange(3,1,1,8).setValues([['Ativo','Amostras','🟢 Verde','🟡 Amarelo','🔴 Vermelho','%Verde','%Amarelo','%Vermelho']]).setFontWeight('bold');
  }
  let log = ss.getSheetByName(WEEKLY_LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(WEEKLY_LOG_SHEET);
    log.getRange(1,1,1,4).setValues([['WeekKey','PDF_URL','Start','End']]).setFontWeight('bold');
  }
}

/* ========================= HISTORICO30 ========================= */
function ensureHistory30() {
  const ss = SS_();
  let sh = ss.getSheetByName(HISTORY_SHEET);
  if (!sh) sh = ss.insertSheet(HISTORY_SHEET);

  const today = new Date();
  const end = new Date(Utilities.formatDate(today, TZ, 'yyyy/MM/dd 00:00:00'));
  end.setHours(0,0,0,0);
  const start = new Date(end); start.setDate(end.getDate()-29);

  const rel = getSheet();
  const last = rel ? rel.getLastRow() : 0;
  const rows = last>=2 ? rel.getRange(2,1,last-1,HEADERS.length).getValues() : [];

  const map = {};
  rows.forEach(r=>{
    const iso = r[1]; const asset = r[3]; const close = Number(r[8]);
    if (!iso || !asset || isNaN(close)) return;
    const d = new Date(iso);
    const dStr = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    const ts = d.getTime();
    if (!map[dStr]) map[dStr] = {};
    const cur = map[dStr][asset];
    if (!cur || ts > cur.ts) map[dStr][asset] = { ts, close };
  });

  const header = ['Data'].concat(ASSETS);
  const out = [header];
  let lastKnown = {};

  // procura último close antes do início
  for (let back=1; back<=60; back++){
    const probe = new Date(start); probe.setDate(start.getDate()-back);
    const key = Utilities.formatDate(probe,TZ,'yyyy-MM-dd');
    if (map[key]) ASSETS.forEach(a=>{ if (map[key][a] && lastKnown[a]===undefined) lastKnown[a] = map[key][a].close; });
    if (ASSETS.every(a => lastKnown[a]!==undefined)) break;
  }

  for (let i=0;i<30;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const key = Utilities.formatDate(d,TZ,'yyyy-MM-dd');
    const row = [key];
    ASSETS.forEach(a=>{
      let val = '';
      if (map[key] && map[key][a]) { val = map[key][a].close; lastKnown[a] = val; }
      else if (lastKnown[a]!==undefined) { val = lastKnown[a]; }
      row.push(val);
    });
    out.push(row);
  }

  sh.clear();
  sh.getRange(1,1,out.length, out[0].length).setValues(out);
  sh.getRange(1,1,1,out[0].length).setFontWeight('bold');
  sh.autoResizeColumns(1, out[0].length);
}

/* ========================= HEARTBEAT & MONITOR ========================= */
function ensureHeartbeat_(){
  const ss = SS_();
  let sh = ss.getSheetByName(HEARTBEAT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(HEARTBEAT_SHEET);
    sh.getRange(1,1,1,6).setValues([['Data','Janela','Timestamp','ReportId','Itens','Status']]).setFontWeight('bold');
  }
  return sh;
}
function updateHeartbeat_(report){
  const sh = ensureHeartbeat_();
  const ts = report?.runAtISO || new Date().toISOString();
  const win = String(report?.windowLabel || '');
  const datePT = Utilities.formatDate(new Date(ts), TZ, 'yyyy-MM-dd');
  sh.appendRow([datePT, win, ts, report?.reportId || '', ASSETS.length, 'OK']);
}

// Triggers (monitor + manutenção)
function setupMonitoringTriggers_(){
  ScriptApp.getProjectTriggers().forEach(t=>{ if (t.getHandlerFunction()==='checkDailyRuns_') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('checkDailyRuns_').timeBased().everyMinutes(15).create();
}
function setupMaintenanceTriggers_() {
  ScriptApp.getProjectTriggers().forEach(t=>{ if (t.getHandlerFunction()==='refreshDailyArtifacts_') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('refreshDailyArtifacts_').timeBased().atHour(23).nearMinute(55).create();
}
function refreshDailyArtifacts_(){
  ensureSpreadsheetTZ_();
  ensureHistory30();
  ensureReliability30Sheet_();
}

function checkDailyRuns_(){
  const ss = SS_();
  const now = new Date();
  const hhmm = Utilities.formatDate(now, TZ, 'HH:mm');
  const today = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');

  const rel = getSheet();
  if (!rel || rel.getLastRow()<2) return;

  const data = rel.getRange(2,1,rel.getLastRow()-1,5).getValues(); // A..E
  const expected = ASSETS.length;

  const missingWins = [];
  WINDOWS.forEach(w=>{
    const count = countWindow_(data, today, w.label);
    const ok = count >= expected;
    if (hhmm >= w.alertAfter && !ok) missingWins.push({label: w.label, count});
  });

  if (missingWins.length){
    const mapOK = Object.fromEntries(WINDOWS.map(w=>{
      const count = countWindow_(data, today, w.label);
      return [w.label, count>=expected];
    }));
    sendMonitorAlerts_(today, missingWins, mapOK);
  }
}
function countWindow_(rows, ymd, win){
  let c = 0;
  rows.forEach(r=>{
    const ts = r[1]; const janela = r[2]; const ativo = r[3];
    if (!ts || !janela || !ativo) return;
    const d = Utilities.formatDate(new Date(ts), TZ, 'yyyy-MM-dd');
    if (d===ymd && String(janela)===win) c++;
  });
  return c;
}
function sendMonitorAlerts_(ymd, missingWins, okMap){
  const subject = `⏰ Monitor diário — falhas: ${missingWins.map(m=>m.label).join(', ')}`;
  let html = `<h3>Monitor diário — ${ymd}</h3><table border="1" cellpadding="6" cellspacing="0"><tr><th>Janela</th><th>Status</th><th>Registos</th></tr>`;
  WINDOWS.forEach(w=>{
    const ok = okMap[w.label]; const count = missingWins.find(m=>m.label===w.label)?.count ?? '—';
    html += `<tr><td>${w.label}</td><td><b>${ok?'OK':'FALHOU'}</b></td><td>${count}</td></tr>`;
  });
  html += `</table><p>Sheet: <a href="${SHEET_URL}">${SHEET_URL}</a></p>`;

  getAlertEmails_().forEach(to=> MailApp.sendEmail({to, subject, htmlBody: html, noReply:true}));

  if (discordWebhookUrl_()){
    const color = 0xE67E22;
    const fields = WINDOWS.map(w=>({ name: w.label, value: okMap[w.label] ? 'OK' : 'FALHOU', inline: true }));
    const embed = { title: `⏰ Monitor diário — ${ymd}`, url: SHEET_URL, color, fields, timestamp: new Date().toISOString() };
    discordPost_({ embeds:[embed] });
  }
}

/* ========================= FIABILIDADE 30D ========================= */
function ensureReliability30Sheet_(){
  const ss = SS_();
  let sh = ss.getSheetByName(RELIAB_SHEET);
  if (!sh) sh = ss.insertSheet(RELIAB_SHEET);

  const today = new Date();
  const end = new Date(Utilities.formatDate(today, TZ, 'yyyy/MM/dd 00:00:00')); end.setHours(0,0,0,0);
  const start = new Date(end); start.setDate(end.getDate()-29);

  const rel = getSheet();
  const last = rel ? rel.getLastRow() : 0;
  const data = last>=2 ? rel.getRange(2,1,last-1,5).getValues() : []; // A..E

  const dayMap = {};
  for (let i=0;i<data.length;i++){
    const row = data[i];
    const ts = row[1]; const w = String(row[2]||''); const asset = row[3];
    if (!ts || !w || !asset) continue;
    const dStr = Utilities.formatDate(new Date(ts), TZ, 'yyyy-MM-dd');
    dayMap[dStr] = dayMap[dStr] || {};
    dayMap[dStr][w] = (dayMap[dStr][w]||0) + 1;
  }

  // Sucesso: nº de janelas completas por dia (>= nº de ativos)
  const header = ['Data','Sucessos (0–N)','% Sucesso'];
  const out = [header];
  let days100 = 0; let sumPct = 0;

  for (let i=0;i<30;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const key = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    const wmap = dayMap[key] || {};
    const succ = WINDOWS.reduce((acc,w)=> acc + ((wmap[w.label]||0) >= ASSETS.length ? 1 : 0), 0);
    const pct = WINDOWS.length ? succ / WINDOWS.length : 0;
    if (succ===WINDOWS.length) days100++;
    sumPct += pct;
    out.push([key, succ, pct]);
  }

  sh.clear();
  sh.getRange(1,1,out.length,out[0].length).setValues(out);
  sh.getRange(1,1,1,out[0].length).setFontWeight('bold');
  sh.getRange(2,3,out.length-1,1).setNumberFormat('0.00%');

  // Heatmap simples na % Sucesso
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .setGradientMaxpoint('#2ecc71')
      .setGradientMidpointWithValue('#f1c40f', SpreadsheetApp.InterpolationType.PERCENT, '50')
      .setGradientMinpoint('#e74c3c')
      .setRanges([sh.getRange(2,3,out.length-1,1)])
      .build()
  ];
  sh.clearConditionalFormatRules();
  sh.setConditionalFormatRules(rules);

  // Sumário no topo
  const avg30 = sumPct/30;
  sh.getRange(1,5).setValue('Média 30D').setFontWeight('bold');
  sh.getRange(2,5).setValue(avg30).setNumberFormat('0.00%');
  sh.getRange(1,6).setValue(`Dias 100% (30D)`).setFontWeight('bold');
  sh.getRange(2,6).setValue(days100);

  sh.autoResizeColumns(1, 6);
}

/* ========================= SEMANAL (percentagens + PDF) ========================= */
function maybeGenerateWeekly_(report) {
  const ts = report?.runAtISO ? new Date(report.runAtISO) : new Date();
  const local = new Date(Utilities.formatDate(ts, TZ, "yyyy/MM/dd HH:mm:ss"));
  const isMonday = local.getDay() === 1; // segunda
  const is0830 = (Utilities.formatDate(local, TZ, "HH:mm") === "08:30");
  if (!(isMonday && is0830)) return;

  const key = Utilities.formatDate(new Date(local.getTime()-24*3600*1000), TZ, "YYYY-'W'ww");
  const prop = PropertiesService.getScriptProperties();
  if (prop.getProperty('lastWeeklyKey') === key) return;

  const { start, end } = previousWeekRange_(local);
  const stats = buildWeeklyStats_(start, end);
  writeWeeklySheet_(stats, start, end);
  const pdfUrl = exportWeeklyPDF_(start, end);
  logWeekly_(key, pdfUrl, start, end);
  prop.setProperty('lastWeeklyKey', key);
}
function previousWeekRange_(ref) {
  const day = ref.getDay(); // Mon=1
  const mondayThisWeek = new Date(ref); mondayThisWeek.setDate(ref.getDate() - (day-1)); mondayThisWeek.setHours(0,0,0,0);
  const mondayPrev = new Date(mondayThisWeek); mondayPrev.setDate(mondayThisWeek.getDate()-7);
  const sundayPrev = new Date(mondayPrev); sundayPrev.setDate(mondayPrev.getDate()+6); sundayPrev.setHours(23,59,59,999);
  return { start: mondayPrev, end: sundayPrev };
}
function buildWeeklyStats_(start, end) {
  const sh = getSheet();
  const last = sh.getLastRow(); if (last < 2) return {};
  const data = sh.getRange(2,1,last-1,HEADERS.length).getValues();
  const out = {}; ASSETS.forEach(a=> out[a] = { total:0, green:0, yellow:0, red:0 });

  data.forEach(row=>{
    const dtISO = row[1]; if (!dtISO) return;
    const d = new Date(dtISO);
    if (d < start || d > end) return;
    const sym = row[3]; if (!out[sym]) return;
    const score = computeScoreFromRow_(row);
    let color = 'red';
    if (score >= 20) color = 'green';
    else if (score >= 5) color = 'yellow';
    out[sym].total++; out[sym][color]++;
  });
  Object.values(out).forEach(o=>{
    const t=o.total||1;
    o.pGreen = o.green/t; o.pYellow = o.yellow/t; o.pRed = o.red/t;
  });
  return out;
}
function computeScoreFromRow_(row) {
  const price = Number(row[4]||0);
  const var24 = Number(row[9]||0);
  const rsi   = Number(row[12]||0);
  const macdH = Number(row[15]||0);
  const sma20 = Number(row[16]||0);
  const sma50 = Number(row[17]||0);
  const sma100= Number(row[18]||0);
  const sma200= Number(row[19]||0);
  const bollW = Number(row[23]||0);
  const fng   = Number(row[34]||0);
  const trend = String(row[29]||'').toLowerCase();

  let score = 0;
  score += (trend==='alta'?20:(trend==='baixa'?-20:0));
  score += (macdH>0?10:(macdH<0?-10:0));
  if (rsi>=70) score += -5; else if (rsi>=60) score += 10; else if (rsi<=30) score += 10; else if (rsi<=40) score += -10;
  score += (price>sma20?5:-5) + (price>sma50?5:-5) + (price>sma100?5:-5) + (price>sma200?5:-5);
  score += (fng>=70?-5:(fng<=30?5:0));
  score += (bollW<0.03?2:0);
  score += (var24>0?2:(var24<0?-2:0));
  return Math.round(score);
}
function writeWeeklySheet_(stats, start, end) {
  const ss = SS_();
  let sh = ss.getSheetByName(WEEKLY_SHEET);
  if (!sh) sh = ss.insertSheet(WEEKLY_SHEET);
  sh.clear();

  sh.getRange(1,1).setValue('📅 Semana'); sh.getRange(1,2).setValue(`${Utilities.formatDate(start,TZ,'yyyy-MM-dd')} → ${Utilities.formatDate(end,TZ,'yyyy-MM-dd')}`).setFontWeight('bold');
  const header = ['Ativo','Amostras','🟢 Verde','🟡 Amarelo','🔴 Vermelho','%Verde','%Amarelo','%Vermelho'];
  sh.getRange(3,1,1,header.length).setValues([header]).setFontWeight('bold');

  const rows = ASSETS.map(a=>{
    const o = stats[a]||{total:0,green:0,yellow:0,red:0,pGreen:0,pYellow:0,pRed:0};
    return [a,o.total,o.green,o.yellow,o.red,o.pGreen,o.pYellow,o.pRed];
  });
  sh.getRange(4,1,rows.length,rows[0].length).setValues(rows);
  sh.getRange(4,6,rows.length,3).setNumberFormat('0.00%');
  sh.autoResizeColumns(1, 8);
}
function exportWeeklyPDF_(start, end) {
  const ss = SS_();
  const src = ss.getSheetByName(WEEKLY_SHEET);
  const tmp = SpreadsheetApp.create(`Cripto Weekly ${Utilities.formatDate(start,TZ,'yyyy-MM-dd')}`);
  const dst = tmp.getSheets()[0]; dst.setName('Semanal');
  const range = src.getRange(1,1,src.getLastRow(), src.getLastColumn());
  range.copyTo(dst.getRange(1,1), {contentsOnly:true});
  const blob = tmp.getAs('application/pdf').setName(`Cripto-Weekly-${Utilities.formatDate(start,TZ,'yyyy-MM-dd')}.pdf`);
  const file = DriveApp.createFile(blob);
  DriveApp.getFileById(tmp.getId()).setTrashed(true);
  return file.getUrl();
}
function logWeekly_(key, url, start, end) {
  const ss = SS_();
  let log = ss.getSheetByName(WEEKLY_LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(WEEKLY_LOG_SHEET);
    log.getRange(1,1,1,4).setValues([['WeekKey','PDF_URL','Start','End']]).setFontWeight('bold');
  }
  log.appendRow([key, url, Utilities.formatDate(start,TZ,'yyyy-MM-dd'), Utilities.formatDate(end,TZ,'yyyy-MM-dd')]);

  const summary = ss.getSheetByName(SUMMARY_SHEET);
  if (summary && url) summary.getRange('F3').setFormula(`=HYPERLINK("${url}","Abrir último PDF")`);
}

/** ===== UI MENU ===== **/
function onOpen(e) { buildMenu_(); }
function onInstall(e) { onOpen(e); }

function buildMenu_(){
  SpreadsheetApp.getUi().createMenu('📈 Cripto Dashboard')
    .addItem('Abrir Painel', 'uiOpenPainel_')
    .addItem('Abrir Resumo', 'uiOpenResumo_')
    .addSeparator()
    .addItem('One-click: Ativar & Construir', 'oneClickActivate_')
    .addItem('Testar Notificações (Discord/Email)', 'testAllNotifications_')
    .addSeparator()
    .addItem('Executar análise agora (DailyRunner)', 'runNeutralAnalysisNow_Menu_')
    .addSeparator()
    .addItem('Atualizar artefactos diários agora', 'refreshDailyArtifacts_')
    .addToUi();
}

function uiOpenPainel_(){
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(DASHBOARD_SHEET) || ensureDashboard();
  ss.setActiveSheet(sh);
}
function uiOpenResumo_(){
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SUMMARY_SHEET) || ensureSummary();
  ss.setActiveSheet(sh);
}
function runNeutralAnalysisNow_Menu_(){
  var label = Utilities.formatDate(new Date(), TZ, 'HH:mm') + ' (Manual)';
  try {
    var res = runNeutralAnalysisNow_(label);
    SpreadsheetApp.getActive().toast('DailyRunner OK');
    Logger.log(res);
    return res;
  } catch (e) {
    SpreadsheetApp.getUi().alert('Erro DailyRunner: ' + e);
    throw e;
  }
}
function fixFormulaErrorsNow_(){
  const ss = SS_();
  const p = ss.getSheetByName(DASHBOARD_SHEET); if (p) buildDashboardLayout_(p);
  const a = ss.getSheetByName(ALERTS_SHEET);    if (a) { buildAlertsLayout_(a); addAlertsFormatting_(a); }
  const s = ss.getSheetByName(SUMMARY_SHEET);   if (s) refreshSummaryCharts_(s);
  SpreadsheetApp.getActive().toast('Formulas reconstruídas. Verifique Painel/Alertas/Resumo.');
}
