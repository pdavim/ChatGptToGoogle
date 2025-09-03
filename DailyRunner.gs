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

