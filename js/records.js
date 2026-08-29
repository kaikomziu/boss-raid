// 📖 きろく: 実績 / 称号 / 討伐図鑑 / 統計
import { t, fmtNum, currentLang, onLangChange } from './i18n.js';

const K_ACH = 'bossraid_ach';
const K_CODEX = 'bossraid_codex';

const TITLE_NEED = [0, 500, 5000, 30000, 150000, 700000, 3000000, 15000000, 80000000];

const ACHIEVEMENTS = [
  { id: 'first',    f: (s) => s.kills >= 1 },
  { id: 'kill10',   f: (s) => s.kills >= 10 },
  { id: 'kill50',   f: (s) => s.kills >= 50 },
  { id: 'kill100',  f: (s) => s.kills >= 100 },
  { id: 'kill500',  f: (s) => s.kills >= 500 },
  { id: 'clk1k',    f: (s) => s.clicks >= 1000 },
  { id: 'clk10k',   f: (s) => s.clicks >= 10000 },
  { id: 'clk100k',  f: (s) => s.clicks >= 100000 },
  { id: 'clk1m',    f: (s) => s.clicks >= 1000000 },
  { id: 'dmg1m',    f: (s) => s.dmgTotal >= 1000000 },
  { id: 'dmg10m',   f: (s) => s.dmgTotal >= 10000000 },
  { id: 'dmg100m',  f: (s) => s.dmgTotal >= 100000000 },
  { id: 'ses1k',    f: (s) => s.sessionDmg >= 1000 },
  { id: 'ses10k',   f: (s) => s.sessionDmg >= 10000 },
  { id: 'weak10',   f: (s) => s.weakHits >= 10 },
  { id: 'weak100',  f: (s) => s.weakHits >= 100 },
  { id: 'contrib1', f: (s) => s.bestPct >= 1 },
  { id: 'contrib5', f: (s) => s.bestPct >= 5 },
  { id: 'night',    f: () => { const h = new Date().getHours(); return h >= 0 && h < 5; } },
  { id: 'petlegend', f: (s) => s.petStage >= 4 },
  { id: 'skins5',   f: (s) => s.skinsSeen >= 5 },
  { id: 'play1h',   f: (s) => s.playSec >= 3600 },
];

let unlocked = new Set();
let cfg = {};
const els = {};

function loadAch() {
  try { unlocked = new Set(JSON.parse(localStorage.getItem(K_ACH)) || []); } catch (_) { unlocked = new Set(); }
}
function saveAch() { localStorage.setItem(K_ACH, JSON.stringify([...unlocked])); }

// dmg → { index, name, nextAt, nextName }
export function titleFor(dmg) {
  let idx = 0;
  for (let i = 0; i < TITLE_NEED.length; i++) if (dmg >= TITLE_NEED[i]) idx = i;
  const hasNext = idx < TITLE_NEED.length - 1;
  return {
    index: idx,
    name: t('title.' + idx),
    nextAt: hasNext ? TITLE_NEED[idx + 1] : null,
    nextName: hasNext ? t('title.' + (idx + 1)) : null,
  };
}

export function checkAchievements(snap) {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.has(a.id) && a.f(snap)) { unlocked.add(a.id); fresh.push(a); }
  }
  if (fresh.length) { saveAch(); fresh.forEach(toast); }
  return fresh;
}

function toast(a) {
  const el = document.createElement('div');
  el.className = 'ach-toast';
  el.innerHTML = t('ach.toast', { name: t('a.' + a.id + '.n'), desc: t('a.' + a.id + '.d') });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3800);
}

// ---- 討伐図鑑 (creatureId等を保存し、表示時に現在言語で組み立てる) ----
export function recordDefeat(entry) {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(K_CODEX)) || []; } catch (_) {}
  list.unshift({
    i: entry.index, t: Date.now(),
    d: Math.round(entry.myDmg),
    p: entry.myMax > 0 ? entry.myDmg / entry.myMax * 100 : 0,
    nm: entry.name || '',              // 旧データ/あだ名フォールバック
    sl: !!entry.slime, px: entry.prefixIdx, cr: entry.creatureId,
  });
  if (list.length > 150) list.length = 150;
  localStorage.setItem(K_CODEX, JSON.stringify(list));
}
function codexList() {
  try { return JSON.parse(localStorage.getItem(K_CODEX)) || []; } catch (_) { return []; }
}
function codexName(e) {
  if (e.nm) return e.nm;
  if (e.sl) return t('boss.slime');
  if (e.cr != null) return t('boss.format', { prefix: t('bp.' + e.px), creature: t('bc.' + e.cr) });
  return '#' + (e.i + 1);
}

// ---- パネル ----
export function initRecords(c) {
  cfg = c || {};
  loadAch();
  els.btn = document.getElementById('recordsBtn');
  els.panel = document.getElementById('recordsPanel');
  els.body = document.getElementById('recordsBody');
  els.tabs = document.getElementById('recordsTabs');

  els.btn.addEventListener('click', () => { openTab('ach'); els.panel.classList.add('show'); });
  document.getElementById('recordsClose').addEventListener('click', () => els.panel.classList.remove('show'));
  els.panel.addEventListener('click', (e) => { if (e.target === els.panel) els.panel.classList.remove('show'); });
  els.tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => openTab(b.dataset.tab)));

  onLangChange(() => { if (els.panel.classList.contains('show')) openTab(activeTab); });
}

let activeTab = 'ach';
function openTab(name) {
  activeTab = name;
  els.tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  const s = cfg.getStats();
  if (name === 'ach') renderAch();
  else if (name === 'title') renderTitle(s);
  else if (name === 'codex') renderCodex();
  else renderStats(s);
}

function renderAch() {
  const rows = ACHIEVEMENTS.map((a) => {
    const got = unlocked.has(a.id);
    return `<div class="rec-ach ${got ? 'got' : ''}"><span class="ra-i">${got ? '🏅' : '🔒'}</span>` +
      `<span class="ra-t"><b>${t('a.' + a.id + '.n')}</b><small>${t('a.' + a.id + '.d')}</small></span></div>`;
  }).join('');
  els.body.innerHTML = `<div class="rec-count">${t('rec.count', { got: unlocked.size, total: ACHIEVEMENTS.length })}</div>${rows}`;
}

function renderTitle(s) {
  const cur = titleFor(s.dmgTotal);
  const rows = TITLE_NEED.map((need, i) => {
    const got = s.dmgTotal >= need;
    const here = i === cur.index;
    return `<div class="rec-title ${got ? 'got' : ''} ${here ? 'cur' : ''}">` +
      `<b>${t('title.' + i)}</b><small>${t('rec.titleNeed', { n: fmtNum(need) })} ${here ? t('rec.here') : ''}</small></div>`;
  }).join('');
  const prog = cur.nextAt
    ? `<div class="rec-next">${t('rec.nextTitle', { name: cur.nextName, n: fmtNum(cur.nextAt - s.dmgTotal) })}</div>`
    : `<div class="rec-next">${t('rec.maxTitle')}</div>`;
  els.body.innerHTML = `<div class="rec-cur-title">${t('rec.curTitle')}<br><b>${cur.name}</b></div>${prog}${rows}`;
}

function renderCodex() {
  const list = codexList();
  if (!list.length) { els.body.innerHTML = `<p class="rec-empty">${t('rec.codexEmpty')}</p>`; return; }
  const loc = currentLang();
  els.body.innerHTML = list.map((e) => {
    const d = new Date(e.t);
    let dt;
    try { dt = new Intl.DateTimeFormat(loc, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d); }
    catch (_) { dt = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`; }
    const pct = e.p < 0.01 && e.p > 0 ? '<0.01' : e.p.toFixed(2);
    return `<div class="rec-codex"><span class="rc-no">#${e.i + 1}</span>` +
      `<span class="rc-mid"><b>${codexName(e)}</b><small>${dt}</small></span>` +
      `<span class="rc-dmg">${fmtNum(e.d)}<small>${pct}%</small></span></div>`;
  }).join('');
}

function renderStats(s) {
  const cur = titleFor(s.dmgTotal);
  const hrs = Math.floor(s.playSec / 3600), min = Math.floor((s.playSec % 3600) / 60);
  const rows = [
    [t('stat.title'), cur.name],
    [t('stat.clicks'), fmtNum(s.clicks)],
    [t('stat.dmg'), fmtNum(s.dmgTotal)],
    [t('stat.kills'), t('stat.killsUnit', { n: fmtNum(s.kills) })],
    [t('stat.dps'), t('stat.dpsUnit', { n: fmtNum(s.bestDps) })],
    [t('stat.weak'), t('stat.weakUnit', { n: fmtNum(s.weakHits) })],
    [t('stat.bestPct'), (s.bestPct || 0).toFixed(2) + ' %'],
    [t('stat.playtime'), t('stat.playtimeVal', { h: hrs, m: min })],
  ];
  els.body.innerHTML = rows.map(([k, v]) => `<div class="rec-stat"><span>${k}</span><b>${v}</b></div>`).join('');
}
