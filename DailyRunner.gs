/**
 * DailyRunner.gs
 * Funções chamadas por triggers agendados para manutenção diária.
 */

/**
 * Executa uma função com tratamento de erros e notificação.
 * @param {Function} fn    Função a executar.
 * @param {string}   label Rótulo para logs e alertas.
 */
function safeRun_(fn, label) {
  try {
    fn();
  } catch (e) {
    const stack = e && e.stack ? e.stack : String(e);
    Logger.log(stack);
    try {
      const summary = '[' + label + '] ' + (e && e.message ? e.message : e);
      const errUrl = typeof discordErrorWebhookUrl_ === 'function' && discordErrorWebhookUrl_();
      if (errUrl) {
        const payload = { content: summary.slice(0, 2000) };
        fetchJson_(errUrl, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
        });
      } else if (typeof getAlertEmails_ === 'function') {
        const subject = 'Falha em ' + label;
        const htmlBody = `<p>${summary}</p><pre>${stack}</pre>`;
        getAlertEmails_().forEach(to =>
          MailApp.sendEmail({ to, subject, htmlBody, noReply: true })
        );
      }
    } catch (inner) {
      Logger.log(inner);
    }
  }
}

/** Executa a rotina de atualização diária dos artefatos. */
function runDailyRefresh_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) {
    Logger.log('runDailyRefresh_ lock unavailable');
    return;
  }
  try {
    safeRun_(refreshDailyArtifacts_, 'runDailyRefresh_');
  } finally {
    lock.releaseLock();
  }
}

/** Verifica se as execuções do dia ocorreram como esperado. */
function runDailyMonitor_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) {
    Logger.log('runDailyMonitor_ lock unavailable');
    return;
  }
  try {
    safeRun_(checkDailyRuns_, 'runDailyMonitor_');
  } finally {
    lock.releaseLock();
  }
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
  return testWebAppPostImpl_();
}

