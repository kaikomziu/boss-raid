import { FLUSH_INTERVAL } from './config.js';
import { bossFor } from './bosses.js';
import { fetchState, sendHit, subscribeState, joinPresence } from './net.js';
import {
  setMuted, isMuted, playPoko, playFanfare,
  initCanvas, fireworks, initPopLayer, popDamage, initShake, shake,
} from './fx.js';
import { VERSION_HISTORY, CURRENT_VERSION } from './version.js';
import { SKINS, SKIN_PROPS } from './skins.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.max(0, Math.floor(n)).toLocaleString('en-US');

// ---------------- 永続データ ----------------
const LS = {
  get total() { return +localStorage.getItem('bossraid_totalClicks') || 0; },
  set total(v) { localStorage.setItem('bossraid_totalClicks', v); },
  get kills() { return +localStorage.getItem('bossraid_kills') || 0; },
  set kills(v) { localStorage.setItem('bossraid_kills', v); },
  get muted() { return localStorage.getItem('bossraid_muted') === '1'; },
  set muted(v) { localStorage.setItem('bossraid_muted', v ? '1' : '0'); },
  get curIndex() { return +localStorage.getItem('bossraid_curIndex'); },
  set curIndex(v) { localStorage.setItem('bossraid_curIndex', v); },
  get curDmg() { return +localStorage.getItem('bossraid_curDmg') || 0; },
  set curDmg(v) { localStorage.setItem('bossraid_curDmg', v); },
  get skin() { return localStorage.getItem('bossraid_skin') || 'boss'; },
  set skin(v) { localStorage.setItem('bossraid_skin', v); },
};

// ---------------- 状態 ----------------
let boss = bossFor(0);
let serverHp = boss.maxHp;   // サーバー確定HP
let pendingDmg = 0;          // 未送信のダメージ
let inFlight = 0;            // 送信中のダメージ
let shownHp = boss.maxHp;    // 表示用(なめらか補間)
let defeatedCount = 0;
let myBossDamage = 0;        // 現ボスへの自分のダメージ
let ready = false;
let flushTimer = null;

// 全体DPS用サンプル
let dpsSamples = [];
let lastRowHp = null;
let lastRowTime = 0;

// ---------------- DOM ----------------
const el = {};
function cacheDom() {
  ['bossEmoji','bossName','bossNo','hpFill','hpText','hpPct','players',
   'myTotal','myDmg','myDmgPct','killCount','dps','muteBtn','infoBtn',
   'setupBanner','banner','app','fxCanvas','popLayer','shakeWrap'].forEach((k) => {
    el[k] = document.getElementById(k);
  });
}

// ---------------- 描画 ----------------
function targetHp() {
  return Math.max(0, serverHp - pendingDmg - inFlight);
}

function render() {
  const t = targetHp();
  shownHp += (t - shownHp) * 0.25;
  if (Math.abs(shownHp - t) < 1) shownHp = t;

  const pct = boss.maxHp > 0 ? (shownHp / boss.maxHp) * 100 : 0;
  el.hpFill.style.width = pct.toFixed(3) + '%';
  el.hpText.textContent = `${fmt(shownHp)} / ${fmt(boss.maxHp)}`;
  el.hpPct.textContent = pct.toFixed(pct < 1 ? 4 : 1) + '%';

  el.myTotal.textContent = fmt(LS.total);
  el.myDmg.textContent = fmt(myBossDamage);
  const dp = boss.maxHp > 0 ? (myBossDamage / boss.maxHp) * 100 : 0;
  el.myDmgPct.textContent = dp < 0.01 && dp > 0 ? '<0.01%' : dp.toFixed(2) + '%';
  el.killCount.textContent = fmt(defeatedCount);

  requestAnimationFrame(render);
}

function paintBoss() {
  document.documentElement.style.setProperty('--boss-hue', boss.hue);
  el.bossEmoji.textContent = boss.emoji;
  el.bossName.textContent = boss.name;
  el.bossNo.textContent = `BOSS #${boss.index + 1}`;
}

// ---------------- サーバー行の反映 ----------------
function handleServerRow(row) {
  if (!row) return;
  defeatedCount = row.defeated_count ?? defeatedCount;

  // DPS 計算
  const now = performance.now();
  if (lastRowHp != null && row.boss_index === boss.index) {
    const drop = lastRowHp - row.hp;
    if (drop > 0) dpsSamples.push({ drop, t: now });
  }
  lastRowHp = row.hp;
  lastRowTime = now;

  if (row.boss_index > boss.index) {
    // 撃破された! (自分・他人問わず)
    onBossDefeated(row.boss_index, row.hp);
    return;
  }
  if (row.boss_index < boss.index) return; // 古い通知は無視

  // 他人のダメージを検知して控えめに表示(自分の送信ぶんは除く)
  const predicted = serverHp;
  serverHp = row.hp;
  let extra = predicted - row.hp - justFlushed;
  justFlushed = 0;
  if (extra > 0 && ready) flashOthers(extra);
}

function updateDps() {
  const now = performance.now();
  dpsSamples = dpsSamples.filter((s) => now - s.t < 3000);
  const sum = dpsSamples.reduce((a, s) => a + s.drop, 0);
  const dps = dpsSamples.length ? sum / 3 : 0;
  el.dps.textContent = fmt(dps) + ' /秒';
}
setInterval(updateDps, 500);

// ---------------- 撃破 ----------------
let othersTimer = 0;
function flashOthers(amount) {
  const n = performance.now();
  if (n - othersTimer < 350) return;
  othersTimer = n;
  const r = el.bossEmoji.getBoundingClientRect();
  popDamage(r.left + r.width / 2, r.top + r.height * 0.35, '-' + fmt(amount), 'others');
  shake(3);
}

function onBossDefeated(newIndex, newHp) {
  const beaten = boss;
  const contributed = myBossDamage > 0;
  if (contributed) { LS.kills = LS.kills + 1; }

  playFanfare();
  fireworks(4200);
  showBanner(
    `💥 ${beaten.name} を撃破！ 💥`,
    contributed
      ? `あなたのダメージ ${fmt(myBossDamage)}(${((myBossDamage / beaten.maxHp) * 100).toFixed(2)}%)`
      : `世界中のプレイヤーが討伐しました`
  );

  boss = bossFor(newIndex);
  serverHp = newHp ?? boss.maxHp;
  shownHp = boss.maxHp;
  pendingDmg = 0;
  myBossDamage = 0;
  lastRowHp = newHp;
  dpsSamples = [];
  LS.curIndex = boss.index;
  LS.curDmg = 0;
  paintBoss();
  bumpBoss();
}

let bannerTimer = null;
function showBanner(title, sub) {
  el.banner.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${sub}</div>`;
  el.banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.banner.classList.remove('show'), 4200);
}

// ---------------- クリック ----------------
let comboSum = 0;
let comboTimer = 0;
let lastPoko = 0;

function hit() {
  if (!ready) return;
  pendingDmg += 1;
  myBossDamage += 1;
  LS.total = LS.total + 1;
  LS.curDmg = myBossDamage;

  // ダメージポップ(まとめて)
  comboSum += 1;
  const now = performance.now();
  if (now - comboTimer > 70) {
    comboTimer = now;
    const r = el.bossEmoji.getBoundingClientRect();
    popDamage(
      r.left + r.width / 2,
      r.top + r.height * (0.25 + Math.random() * 0.4),
      '-' + comboSum,
      'me'
    );
    comboSum = 0;
  }
  if (now - lastPoko > 45) { playPoko(); lastPoko = now; }
  shake(2.4);
  bumpBoss(0.9);
}

let bumpT = 0;
function bumpBoss(scale = 0.82) {
  el.bossEmoji.style.transform = `scale(${scale})`;
  clearTimeout(bumpT);
  bumpT = setTimeout(() => { el.bossEmoji.style.transform = ''; }, 90);
}

// ---------------- フラッシュ(送信)----------------
let backendOk = false;

async function flush() {
  if (!ready || !backendOk || pendingDmg <= 0 || inFlight > 0) return;
  inFlight = pendingDmg;
  pendingDmg = 0;
  const { data, error } = await sendHit(inFlight);
  if (error) {
    // 失敗 → 戻して再試行。バックエンドが落ちた/未設定なら一旦停止
    pendingDmg += inFlight;
    inFlight = 0;
    backendOk = false;
    el.setupBanner.classList.add('show');
    scheduleReconnect();
    return;
  }
  const mine = inFlight;
  inFlight = 0;
  justFlushed += mine;
  handleServerRow(data);
}

let justFlushed = 0;
let reconnectTimer = null;
function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setInterval(async () => {
    const { data } = await fetchState();
    if (data) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
      applyInitialState(data);
      backendOk = true;
      el.setupBanner.classList.remove('show');
    }
  }, 8000);
}

function applyInitialState(data) {
  const changed = data.boss_index !== boss.index;
  boss = bossFor(data.boss_index);
  serverHp = data.hp;
  shownHp = data.hp;
  defeatedCount = data.defeated_count;
  lastRowHp = data.hp;
  if (LS.curIndex === boss.index && !changed) myBossDamage = LS.curDmg;
  else { myBossDamage = 0; LS.curIndex = boss.index; LS.curDmg = 0; }
  paintBoss();
}

// ---------------- 起動 ----------------
async function boot() {
  cacheDom();
  initCanvas(el.fxCanvas);
  initPopLayer(el.popLayer);
  initShake(el.shakeWrap);

  setMuted(LS.muted);
  el.muteBtn.textContent = LS.muted ? '🔇 音 OFF' : '🔊 音 ON';
  el.muteBtn.addEventListener('click', () => {
    setMuted(!isMuted());
    LS.muted = isMuted();
    el.muteBtn.textContent = isMuted() ? '🔇 音 OFF' : '🔊 音 ON';
  });
  el.infoBtn.addEventListener('click', showInfo);

  // スキン
  buildSkinGrid();
  applySkin(LS.skin);
  const skinPanel = document.getElementById('skinPanel');
  document.getElementById('skinBtn').addEventListener('click', () => skinPanel.classList.add('show'));
  document.getElementById('skinClose').addEventListener('click', () => skinPanel.classList.remove('show'));
  skinPanel.addEventListener('click', (e) => { if (e.target === skinPanel) skinPanel.classList.remove('show'); });

  // クリック領域
  const area = document.getElementById('clickArea');
  area.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(); }, { passive: false });
  // スペース/エンター: キーリピート(長押し)は無視して1回だけ
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      if (skinPanel.classList.contains('show')) return;
      e.preventDefault();
      hit();
    }
  });

  // 同じボスへの自分のダメージ記録を復元(オフラインでも)
  if (LS.curIndex === boss.index) myBossDamage = LS.curDmg;
  else { LS.curIndex = boss.index; LS.curDmg = 0; }

  render();
  paintBoss();
  ready = true;

  const { data } = await fetchState();
  if (data) {
    applyInitialState(data);
    backendOk = true;
  } else {
    el.setupBanner.classList.add('show');
    scheduleReconnect();
  }

  subscribeState((row) => { backendOk = true; handleServerRow(row); });
  joinPresence((n) => { el.players.textContent = fmt(n); });

  flushTimer = setInterval(flush, FLUSH_INTERVAL);
  window.addEventListener('beforeunload', flush);
}

// ---------------- スキン ----------------
function applySkin(id) {
  const skin = SKINS.find((s) => s.id === id) || SKINS[0];
  const root = document.documentElement;
  SKIN_PROPS.forEach((p) => root.style.removeProperty(p));
  for (const [k, v] of Object.entries(skin.vars)) root.style.setProperty(k, v);
  LS.skin = skin.id;
  document.querySelectorAll('.skin-swatch').forEach((b) => {
    b.classList.toggle('sel', b.dataset.id === skin.id);
  });
}

function buildSkinGrid() {
  const grid = document.getElementById('skinGrid');
  grid.innerHTML = '';
  for (const s of SKINS) {
    const bg0 = s.vars['--bg0'] || getComputedStyle(document.documentElement).getPropertyValue('--bg0');
    const bg1 = s.vars['--bg1'] || bg0;
    const acc = s.vars['--skin-accent'] || 'hsl(200 90% 62%)';
    const b = document.createElement('button');
    b.className = 'skin-swatch';
    b.dataset.id = s.id;
    b.style.setProperty('--sw-acc', acc);
    b.innerHTML =
      `<span class="chip" style="background:linear-gradient(150deg,${bg0},${bg1})">${s.icon}</span>` +
      `<span class="nm">${s.name}</span>`;
    b.addEventListener('click', () => applySkin(s.id));
    grid.appendChild(b);
  }
}

function showInfo() {
  const rows = VERSION_HISTORY.slice().reverse()
    .map((v) => `<li><b>v${v.version}</b> <span>${v.date}</span><br>${v.notes}</li>`).join('');
  el.banner.innerHTML = `
    <div class="banner-title">BOSS RAID <small>v${CURRENT_VERSION}</small></div>
    <div class="banner-sub info-sub">
      1億HPのボスを世界中のプレイヤーとリアルタイム協力で連打して倒すゲーム。
      倒すたび少しずつ強い次のボスが無限に出現します。<br>
      画面のどこをクリック/タップしてもOK。スペース/エンターキーでも殴れます。
      <ul class="ver">${rows}</ul>
    </div>`;
  el.banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.banner.classList.remove('show'), 9000);
}

boot();
