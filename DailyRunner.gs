/**
 * DailyRunner.gs
 * Funções chamadas por triggers agendados para manutenção diária.
 */

/** Executa a rotina de atualização diária dos artefatos. */
function runDailyRefresh_() {
  try { refreshDailyArtifacts_(); } catch (e) { Logger.log(e); }
}

/** Verifica se as execuções do dia ocorreram como esperado. */
function runDailyMonitor_() {
  try { checkDailyRuns_(); } catch (e) { Logger.log(e); }
}

/**
 * Executa imediatamente a análise neutra.
 * Atualmente, delega para a rotina de atualização diária
 * para garantir que os artefatos sejam atualizados.
 */
function runNeutralAnalysisNow_(label) {
  Logger.log('runNeutralAnalysisNow_ ' + label);
  runDailyRefresh_();
  return { ok: true, label: label };
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
    secret: SECRET,
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

