// 📖 きろく: 実績(#15) / 称号(#16) / 討伐図鑑(#17) / 統計(#18)
const K_ACH = 'bossraid_ach';
const K_CODEX = 'bossraid_codex';

const TITLES = [
  [0, '村人'], [1000, '見習い'], [20000, '冒険者'], [100000, '戦士'],
  [500000, '勇者'], [2000000, '英雄'], [10000000, '魔王殺し'],
  [50000000, '伝説'], [200000000, '神話'],
];

const ACHIEVEMENTS = [
  { id: 'first',      name: 'はじめの一撃',   desc: 'ボスを1体撃破',            f: (s) => s.kills >= 1 },
  { id: 'kill10',     name: '常連ハンター',   desc: 'ボスを10体撃破',           f: (s) => s.kills >= 10 },
  { id: 'kill50',     name: 'ボスクラッシャー', desc: 'ボスを50体撃破',         f: (s) => s.kills >= 50 },
  { id: 'kill100',    name: '百戦錬磨',       desc: 'ボスを100体撃破',          f: (s) => s.kills >= 100 },
  { id: 'kill500',    name: '殲滅者',         desc: 'ボスを500体撃破',          f: (s) => s.kills >= 500 },
  { id: 'clk1k',      name: 'ウォームアップ', desc: '累計1,000クリック',        f: (s) => s.clicks >= 1000 },
  { id: 'clk10k',     name: '連打職人',       desc: '累計10,000クリック',       f: (s) => s.clicks >= 10000 },
  { id: 'clk100k',    name: '指が仕事する',   desc: '累計100,000クリック',      f: (s) => s.clicks >= 100000 },
  { id: 'clk1m',      name: 'ミリオンフィンガー', desc: '累計1,000,000クリック', f: (s) => s.clicks >= 1000000 },
  { id: 'dmg1m',      name: '削り役',         desc: '累計100万ダメージ',        f: (s) => s.dmgTotal >= 1000000 },
  { id: 'dmg10m',     name: '主砲',           desc: '累計1,000万ダメージ',      f: (s) => s.dmgTotal >= 10000000 },
  { id: 'dmg100m',    name: '一億の一員',     desc: '累計1億ダメージ',          f: (s) => s.dmgTotal >= 100000000 },
  { id: 'ses1k',      name: '本気の一戦',     desc: '1回の来訪で1,000ダメージ', f: (s) => s.sessionDmg >= 1000 },
  { id: 'ses10k',     name: '入り浸り',       desc: '1回の来訪で10,000ダメージ', f: (s) => s.sessionDmg >= 10000 },
  { id: 'weak10',     name: '目ざとい',       desc: '弱点を10回ヒット',          f: (s) => s.weakHits >= 10 },
  { id: 'weak100',    name: '弱点マスター',   desc: '弱点を100回ヒット',         f: (s) => s.weakHits >= 100 },
  { id: 'contrib1',   name: '一翼を担う',     desc: '1体のボスに1%以上貢献',     f: (s) => s.bestPct >= 1 },
  { id: 'contrib5',   name: 'エース',         desc: '1体のボスに5%以上貢献',     f: (s) => s.bestPct >= 5 },
  { id: 'night',      name: '夜ふかし戦士',   desc: '深夜0〜5時にプレイ',        f: () => { const h = new Date().getHours(); return h >= 0 && h < 5; } },
  { id: 'petlegend',  name: '名伯楽',         desc: 'ペットをでんせつまで育てる', f: (s) => s.petStage >= 4 },
  { id: 'skins5',     name: '着せ替え好き',   desc: 'スキンを5種類ためす',        f: (s) => s.skinsSeen >= 5 },
  { id: 'play1h',     name: '腰を据えて',     desc: '累計プレイ1時間',           f: (s) => s.playSec >= 3600 },
];

let unlocked = new Set();
let cfg = {};
const els = {};

function loadAch() {
  try { unlocked = new Set(JSON.parse(localStorage.getItem(K_ACH)) || []); } catch (_) { unlocked = new Set(); }
}
function saveAch() { localStorage.setItem(K_ACH, JSON.stringify([...unlocked])); }

export function titleFor(dmg) {
  let cur = TITLES[0], nxt = null;
  for (let i = 0; i < TITLES.length; i++) {
    if (dmg >= TITLES[i][0]) cur = TITLES[i];
    else { nxt = TITLES[i]; break; }
  }
  return { name: cur[1], nextAt: nxt ? nxt[0] : null, nextName: nxt ? nxt[1] : null };
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
  const t = document.createElement('div');
  t.className = 'ach-toast';
  t.innerHTML = `🏅 <b>実績かいじょ</b><br>${a.name} — <span>${a.desc}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3800);
}

// ---- 討伐図鑑 ----
export function recordDefeat(entry) {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(K_CODEX)) || []; } catch (_) {}
  list.unshift({ i: entry.index, n: entry.name, t: Date.now(), d: Math.round(entry.myDmg), p: entry.myMax > 0 ? entry.myDmg / entry.myMax * 100 : 0 });
  if (list.length > 150) list.length = 150;
  localStorage.setItem(K_CODEX, JSON.stringify(list));
}
function codexList() {
  try { return JSON.parse(localStorage.getItem(K_CODEX)) || []; } catch (_) { return []; }
}

// ---- パネル ----
const fmt = (n) => Math.max(0, Math.floor(n)).toLocaleString('en-US');

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
}

function openTab(name) {
  els.tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  const s = cfg.getStats();
  if (name === 'ach') renderAch(s);
  else if (name === 'title') renderTitle(s);
  else if (name === 'codex') renderCodex();
  else renderStats(s);
}

function renderAch(s) {
  const rows = ACHIEVEMENTS.map((a) => {
    const got = unlocked.has(a.id);
    return `<div class="rec-ach ${got ? 'got' : ''}"><span class="ra-i">${got ? '🏅' : '🔒'}</span>
      <span class="ra-t"><b>${a.name}</b><small>${a.desc}</small></span></div>`;
  }).join('');
  els.body.innerHTML = `<div class="rec-count">${unlocked.size} / ${ACHIEVEMENTS.length}</div>${rows}`;
}

function renderTitle(s) {
  const t = titleFor(s.dmgTotal);
  const rows = TITLES.map(([need, name]) => {
    const got = s.dmgTotal >= need;
    return `<div class="rec-title ${got ? 'got' : ''} ${name === t.name ? 'cur' : ''}">
      <b>${name}</b><small>累計 ${fmt(need)} ダメージ ${name === t.name ? '（いまここ）' : ''}</small></div>`;
  }).join('');
  const prog = t.nextAt
    ? `<div class="rec-next">次「${t.nextName}」まで あと ${fmt(t.nextAt - s.dmgTotal)}</div>` : '<div class="rec-next">最高位に到達！</div>';
  els.body.innerHTML = `<div class="rec-cur-title">現在の称号<br><b>${t.name}</b></div>${prog}${rows}`;
}

function renderCodex() {
  const list = codexList();
  if (!list.length) { els.body.innerHTML = '<p class="rec-empty">まだ討伐記録がありません</p>'; return; }
  els.body.innerHTML = list.map((e) => {
    const d = new Date(e.t);
    const dt = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `<div class="rec-codex"><span class="rc-no">#${e.i + 1}</span>
      <span class="rc-mid"><b>${e.n}</b><small>${dt}</small></span>
      <span class="rc-dmg">${fmt(e.d)}<small>${e.p < 0.01 && e.p > 0 ? '<0.01' : e.p.toFixed(2)}%</small></span></div>`;
  }).join('');
}

function renderStats(s) {
  const t = titleFor(s.dmgTotal);
  const hrs = Math.floor(s.playSec / 3600), min = Math.floor((s.playSec % 3600) / 60);
  const rows = [
    ['称号', t.name],
    ['累計クリック', fmt(s.clicks)],
    ['累計ダメージ', fmt(s.dmgTotal)],
    ['参加した討伐', fmt(s.kills) + ' 体'],
    ['最高DPS', fmt(s.bestDps) + ' /秒'],
    ['弱点ヒット', fmt(s.weakHits) + ' 回'],
    ['最大貢献率', (s.bestPct || 0).toFixed(2) + ' %'],
    ['プレイ時間', `${hrs}時間 ${min}分`],
  ];
  els.body.innerHTML = rows.map(([k, v]) => `<div class="rec-stat"><span>${k}</span><b>${v}</b></div>`).join('');
}
