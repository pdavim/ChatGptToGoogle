function maybePushDiscord_(mode, body, report) {
  if (!discordWebhookUrl_()) return;
  if (mode === 'every' || mode === 'both') {
    // mask secret
    const safe = JSON.parse(JSON.stringify(body || {}));
    if (safe.secret) safe.secret = '***';
    const jsonStr = JSON.stringify(safe, null, 2);
    const max = 1900;
    const content = '```json\n' + (jsonStr.length>max ? jsonStr.slice(0,max)+'\n...[truncated]...' : jsonStr) + '\n```';
    discordPost_({ content });
    pushToDiscordEmbedSummary_(report);
  }
}

function pushToDiscordEmbedChanges_(changes, report) {
  const ts = report?.runAtISO || new Date().toISOString();
  const titleTs = Utilities.formatDate(new Date(ts), APP_TZ, "yyyy-MM-dd HH:mm");
  const { score: globalScore } = readGlobalScore_();
  const color = scoreToColor_(globalScore);

  const bySym = {};
  changes.forEach(ch => { (bySym[ch.sym] = bySym[ch.sym] || []).push(ch); });
  const fields = Object.keys(bySym).map(sym => ({
    name: sym,
    value: bySym[sym].map(ch => `• ${ch.trigger}: **${ch.newState ? 'ON' : 'OFF'}**`).join('\n'),
    inline: true
  })).slice(0, 25);

  const embed = {
    title: `Alertas: mudanças de estado — ${titleTs}`,
    url: SHEET_URL,
    color,
    fields,
    footer: { text: 'Fonte: Google Sheets • Abas: Resumo / Painel / Alertas' },
    timestamp: ts
  };
  discordPost_({ embeds: [embed] });
}
function pushToDiscordEmbedSummary_(report) {
  const ts = report?.runAtISO || new Date().toISOString();
  const titleTs = Utilities.formatDate(new Date(ts), APP_TZ, "yyyy-MM-dd HH:mm");
  const { score: globalScore, emoji } = readGlobalScore_();
  const color = scoreToColor_(globalScore);

  const ss = SS_();
  const p = ss.getSheetByName(DASHBOARD_SHEET);
  const last = p.getLastRow();

  const assets = p.getRange(2,1,last-1,1).getDisplayValues().flat().filter(String);
  const scores = p.getRange(2,19,last-1,1).getDisplayValues().flat().slice(0,assets.length);
  const semas  = p.getRange(2,18,last-1,1).getDisplayValues().flat().slice(0,assets.length);

  const clean = v => (v && v !== '#ERROR!' ? v : '—');

  const fields = assets.map((a, i)=>({
    name: a,
    value: `${clean(semas[i])}  score: **${clean(scores[i])}**`,
    inline: true
  }));

  const embed = {
    title: `Resumo — ${titleTs} ${emoji || ''}`,
    url: SHEET_URL,
    color,
    fields,
    footer: { text: 'Fonte: Google Sheets • Abas: Resumo / Painel' },
    timestamp: ts
  };
  discordPost_({ embeds: [embed] });
}

function readGlobalScore_() {
  const ss = SS_();
  const sh = ss.getSheetByName(SUMMARY_SHEET);
  const score = Number(sh.getRange('B8').getValue() || 0);
  const emoji = String(sh.getRange('C8').getValue() || '');
  return { score, emoji };
}
function scoreToColor_(score) {
  if (score >= 20) return 0x2ECC71; // verde
  if (score >= 5)  return 0xF1C40F; // amarelo
  return 0xE74C3C;                  // vermelho
}

/* ===== Discord helper (forum thread support) ===== */
function discordWebhookUrl_() {
  const base = discordWebhookBase_();
  if (!base) return '';
  const hasQuery = base.indexOf('?') !== -1;
  if (DISCORD_THREAD_ID) return base + (hasQuery ? '&' : '?') + 'thread_id=' + encodeURIComponent(DISCORD_THREAD_ID);
  if (DISCORD_THREAD_NAME) return base + (hasQuery ? '&' : '?') + 'thread_name=' + encodeURIComponent(DISCORD_THREAD_NAME);
  return base;
}
function discordPost_(payload, errorWebhook) {
  const url = discordWebhookUrl_();
  if (!url) return;

  // Trim content and embeds to Discord limits
  if (payload.content) payload.content = String(payload.content).slice(0, 2000);
  if (Array.isArray(payload.embeds)) {
    const maxFields = f => ({
      name: String(f.name || '').slice(0, 256),
      value: String(f.value || '').slice(0, 1024),
      inline: f.inline ? true : false
    });
    payload.embeds = payload.embeds.slice(0, 10).map(e => {
      if (e.title)       e.title       = String(e.title).slice(0, 256);
      if (e.description) e.description = String(e.description).slice(0, 4096);
      if (e.author && e.author.name) e.author.name = String(e.author.name).slice(0, 256);
      if (e.footer && e.footer.text) e.footer.text = String(e.footer.text).slice(0, 2048);
      if (Array.isArray(e.fields)) e.fields = e.fields.slice(0,25).map(maxFields);
      return e;
    });
  }

  const opts = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload) };
  let res = fetchJson_(url, opts);
  if (res.code === 429) {
    Utilities.sleep(1000);
    res = fetchJson_(url, opts);
  }
  const code = res.code;
  const txt  = res.text;
  if (code < 300) return; // OK

  Logger.log('Discord error ' + code + ': ' + txt);
  // fallback para forum threads com ID inválido
  try {
    const body = res.json || {};
    if (body && body.code === 10003 && DISCORD_THREAD_ID) {
      const base = discordWebhookBase_();
      const sep  = base.indexOf('?') !== -1 ? '&' : '?';
      const fallbackUrl = base + sep + 'thread_name=' + encodeURIComponent(DISCORD_THREAD_NAME || 'Cripto Dashboard');
      const res2 = fetchJson_(fallbackUrl, opts);
      Logger.log('Discord fallback ' + res2.code + ': ' + res2.text);
    }
  } catch(e){ Logger.log(e); }

  const errUrl = errorWebhook || discordErrorWebhookUrl_();
  if (errUrl && errUrl !== url) {
    try {
      const msg = 'Discord error ' + code + ': ' + txt;
      const epayload = { content: msg.slice(0, 2000) };
      fetchJson_(errUrl, { method: 'post', contentType: 'application/json', payload: JSON.stringify(epayload) });
    } catch(e){ Logger.log(e); }
  }

  throw new Error('Discord POST failed with code ' + code + ': ' + txt);
}

