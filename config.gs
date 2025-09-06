/************************************************************
 * CRIPTO DASHBOARD – agnóstico ao nº de janelas (2×/dia ou de 2h/2h)
 ************************************************************/

// ====== CONFIG GERAL ======
const APP_TZ = 'Europe/Lisbon';

// Valores sensíveis são obtidos de Script Properties
const DISCORD_THREAD_ID = '';
const DISCORD_THREAD_NAME = 'CriptoDashboard';

const DISCORD_PUSH_MODE = 'both'; // 'alerts' | 'every' | 'both'

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1WkpthzRBRSoobPdIpddzdK9p4ZQqauv6M_dQ5lPmwtU/edit?usp=sharing';
const SHEET_NAME = 'Relatorios';
const DASHBOARD_SHEET = 'Painel';
const SUMMARY_SHEET   = 'Resumo';
const HISTORY_SHEET   = 'Historico30';
const RELIAB_SHEET    = 'Fiabilidade30';
const ALERTS_SHEET    = 'Alertas';
const HEARTBEAT_SHEET = 'Heartbeat';
const WEEKLY_SHEET    = 'Semanal';
const WEEKLY_LOG_SHEET= 'SemanalLog';
const REF_SHEET       = 'Ref';

const REL = qn_(SHEET_NAME);
const PAN = qn_(DASHBOARD_SHEET);
const RES = qn_(SUMMARY_SHEET);
const F30 = qn_(RELIAB_SHEET);
const SEMLOG = qn_(WEEKLY_LOG_SHEET);
const REF = qn_(REF_SHEET);

const ASSETS = ['BTC','ETH','SOL','TRX','POL','SUI'];

// Janelas (ajusta conforme o teu runner). Ex.: 12 ⇒ de 2h/2h
const WINDOWS = Array.from({length: 12}, (_, i) => {
  const hh = ('0' + (i * 2)).slice(-2);
  return { label: `${hh}:00`, alertAfter: `${hh}:10` };
});

// Estado de alertas (persistência)
const ALERT_STATE_SHEET = 'AlertasEstado';
const ALERT_LOG_SHEET   = 'AlertasLog';

// Cabeçalhos dos dados base
const HEADERS = [
  'ReportId','DataHoraExecucao','Janela',
  'Ativo','PrecoAtual','Open','High','Low','Close',
  'Var24h','Var7d','Var30d',
  'RSI14','MACD_Line','MACD_Signal','MACD_Hist',
  'SMA20','SMA50','SMA100','SMA200',
  'Boll_Middle','Boll_Upper','Boll_Lower','BollWidth',
  'ATR14','SAR_Value','SAR_Side','Volume','VolDivergence',
  'Tendencia','Recomendacao','Justificacao',
  'Headline','NewsURL','FearGreed','ContextoNotas'
];

// ==== Script Properties helpers ====
const __PROP = PropertiesService.getScriptProperties();
function getSecret_(){
  return __PROP.getProperty('SECRET');
}
function getAlertEmails_(){
  const raw = __PROP.getProperty('ALERT_EMAILS');
  return raw ? raw.split(/\s*,\s*/).filter(Boolean) : [];
}
function discordWebhookBase_(){
  return __PROP.getProperty('DISCORD_WEBHOOK_URL');
}

function discordErrorWebhookUrl_(){
  return __PROP.getProperty('DISCORD_ERROR_WEBHOOK_URL');
}

function openAiApiKey_(){
  return __PROP.getProperty('OPENAI_API_KEY');
}

