/**
 * DailyRunner.gs
 * Funções chamadas por triggers agendados para manutenção diária.
 */

/** Executa a rotina de atualização diária dos artefatos. */
function runDailyRefresh_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) {
    Logger.log('runDailyRefresh_ lock unavailable');
    return;
  }
  try {
    refreshDailyArtifacts_();
  } catch (e) {
    Logger.log(e);
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
    checkDailyRuns_();
  } catch (e) {
    Logger.log(e);
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

