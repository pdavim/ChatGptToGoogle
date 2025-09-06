/* ========================= HELPERS ========================= */
let __SS_CACHE = null;
function SS_(){
  if (__SS_CACHE) return __SS_CACHE;
  __SS_CACHE = SpreadsheetApp.openByUrl(SHEET_URL);
  return __SS_CACHE;
}

function ensureSpreadsheetTZ_() {
  const ss = SS_();
  if (ss.getSpreadsheetTimeZone() !== TZ) ss.setSpreadsheetTimeZone(TZ);
}
function qn_(name){
  // quoted name for formulas if needed
  if (/[^A-Za-z0-9_]/.test(name)) return "'" + String(name).replace(/'/g,"''") + "'";
  return name;
}
function getSheetByNameCase_(name) {
  const ss = SS_();
  const sheets = ss.getSheets();
  for (let i=0;i<sheets.length;i++){
    if (String(sheets[i].getName()).toLowerCase() === String(name).toLowerCase()) return sheets[i];
  }
  return null;
}
function getSheet() {
  const ss = SS_();
  return getSheetByNameCase_(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}
function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) { sheet.appendRow(HEADERS); return; }
  const existing = sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
  const same = HEADERS.every((h,i)=>(existing[i]||'').toString().trim()===h);
  if (!same) sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
}
function cell(v){ return v===undefined||v===null ? '' : v; }

function itemToRow(reportMeta = {}, item = {}) {
  const { reportId = '', runAtISO = '', windowLabel = '' } = reportMeta || {};
  const {
    symbol, price, open, high, low, close,
    var24h, var7d, var30d, rsi14, macdLine, macdSignal, macdHist,
    sma20, sma50, sma100, sma200,
    bollMiddle, bollUpper, bollLower, bollWidth,
    atr14, sarValue, sarSide, volume, volDivergence,
    trend, recommendation, justification, headline, newsUrl, fearGreed, contextNotes
  } = item || {};

  return [
    cell(reportId), cell(runAtISO), cell(windowLabel),
    cell(symbol), cell(price), cell(open), cell(high), cell(low), cell(close),
    cell(var24h), cell(var7d), cell(var30d),
    cell(rsi14), cell(macdLine), cell(macdSignal), cell(macdHist),
    cell(sma20), cell(sma50), cell(sma100), cell(sma200),
    cell(bollMiddle), cell(bollUpper), cell(bollLower), cell(bollWidth),
    cell(atr14), cell(sarValue), cell(sarSide), cell(volume), cell(volDivergence),
    cell(trend), cell(recommendation), cell(justification),
    cell(headline), cell(newsUrl), cell(fearGreed), cell(contextNotes)
  ];
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fetch JSON with optional caching and exponential backoff.
 * @param {string} url
 * @param {Object} [options]
 * @param {string} [cacheKey]
 * @param {number} [ttlSeconds]
 * @return {{code:number,text:string,json:Object|null}}
 */
function fetchJson_(url, options = {}, cacheKey, ttlSeconds = 30) {
  const cache = cacheKey ? CacheService.getScriptCache() : null;
  if (cache) {
    const cached = cache.get(cacheKey);
    if (cached) return { code: 200, text: cached, json: JSON.parse(cached) };
  }

  const maxAttempts = 5;
  options = options || {};
  options.muteHttpExceptions = true;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res;
    try {
      res = UrlFetchApp.fetch(url, options);
    } catch (err) {
      if (attempt >= maxAttempts - 1) throw err;
      const wait = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      Utilities.sleep(wait);
      continue;
    }

    const code = res.getResponseCode();
    const text = res.getContentText() || '';

    if (code >= 200 && code < 300) {
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) {}
      if (cache && data !== null) cache.put(cacheKey, text, ttlSeconds || 30);
      return { code, text, json: data };
    }

    if ((code === 429 || (code >= 500 && code < 600)) && attempt < maxAttempts - 1) {
      const wait = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      Utilities.sleep(wait);
      continue;
    }

    return { code, text, json: (function(){ try { return JSON.parse(text); } catch(e){ return null; } })() };
  }

  throw new Error('fetchJson_ failed: retries exhausted');
}
