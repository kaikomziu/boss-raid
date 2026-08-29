import { FLUSH_INTERVAL } from './config.js';
import { bossFor } from './bosses.js';
import { fetchState, sendHit, subscribeState, joinPresence, joinTaps } from './net.js';
import {
  setMuted, isMuted, playHit, playFanfare,
  initCanvas, fireworks, initPopLayer, popDamage, initShake, shake,
} from './fx.js';
import { VERSION_HISTORY, CURRENT_VERSION } from './version.js';
import { SKINS, SKIN_PROPS } from './skins.js';
import { initPet, petCelebrate, pokePet, petStageNow } from './pet.js';
import { initKeybinds } from './keybinds.js';
import { loadPrefs, PREFS } from './prefs.js';
import { initSettings } from './settings.js';
import { initHitFx, hitEffect } from './hitfx.js';
import {
  initBossFx, updateBossVisual, tickWeak, isWeakHit, bossIntro, bossDefeatSeq,
} from './bossfx.js';
import { initRecords, checkAchievements, recordDefeat, titleFor } from './records.js';

const fmt = (n) => Math.max(0, Math.floor(n)).toLocaleString('en-US');

// 億 / 万 の概算表記(例: 98234102 -> "9,823万")
function jpShort(n) {
  n = Math.max(0, Math.floor(n));
  if (n >= 1e8) { const oku = n / 1e8; return (oku >= 10 ? oku.toFixed(1) : oku.toFixed(2)) + '億'; }
  if (n >= 1e4) return Math.floor(n / 1e4).toLocaleString('en-US') + '万';
  return n.toLocaleString('en-US');
}

// ---------------- 永続データ ----------------
const numGet = (k) => +localStorage.getItem(k) || 0;
const numSet = (k, v) => localStorage.setItem(k, v);
const LS = {
  get total() { return numGet('bossraid_totalClicks'); },
  set total(v) { numSet('bossraid_totalClicks', v); },
  get dmgTotal() { return numGet('bossraid_dmgTotal'); },
  set dmgTotal(v) { numSet('bossraid_dmgTotal', v); },
  get weakHits() { return numGet('bossraid_weakHits'); },
  set weakHits(v) { numSet('bossraid_weakHits', v); },
  get bestPct() { return numGet('bossraid_bestPct'); },
  set bestPct(v) { numSet('bossraid_bestPct', v); },
  get playSec() { return numGet('bossraid_playSec'); },
  set playSec(v) { numSet('bossraid_playSec', v); },
  get bestDps() { return numGet('bossraid_bestDps'); },
  set bestDps(v) { numSet('bossraid_bestDps', v); },
  get kills() { return numGet('bossraid_kills'); },
  set kills(v) { numSet('bossraid_kills', v); },
  get muted() { return localStorage.getItem('bossraid_muted') === '1'; },
  set muted(v) { localStorage.setItem('bossraid_muted', v ? '1' : '0'); },
  get curIndex() { return +localStorage.getItem('bossraid_curIndex'); },
  set curIndex(v) { numSet('bossraid_curIndex', v); },
  get curDmg() { return numGet('bossraid_curDmg'); },
  set curDmg(v) { numSet('bossraid_curDmg', v); },
  get skin() { return localStorage.getItem('bossraid_skin') || 'boss'; },
  set skin(v) { localStorage.setItem('bossraid_skin', v); },
  skinsSeen() { try { return new Set(JSON.parse(localStorage.getItem('bossraid_skinsSeen')) || []); } catch (_) { return new Set(); } },
  addSkinSeen(id) { const s = LS.skinsSeen(); s.add(id); localStorage.setItem('bossraid_skinsSeen', JSON.stringify([...s])); },
  nick(idx) { try { return (JSON.parse(localStorage.getItem('bossraid_nick')) || {})[idx] || ''; } catch (_) { return ''; } },
  setNick(idx, name) {
    let m = {};
    try { m = JSON.parse(localStorage.getItem('bossraid_nick')) || {}; } catch (_) {}
    if (name) m[idx] = name; else delete m[idx];
    localStorage.setItem('bossraid_nick', JSON.stringify(m));
  },
};

// ---------------- 状態 ----------------
let boss = bossFor(0);
let serverHp = boss.maxHp;
let pendingDmg = 0;
let inFlight = 0;
let shownHp = boss.maxHp;
let defeatedCount = 0;
let myBossDamage = 0;
let sessionDmg = 0;
let peakPlayers = 0;
let playersLive = 1;
let ready = false;
let backendOk = false;
let taps = null;

let dpsSamples = [];
let lastRowHp = null;

// ---------------- DOM ----------------
const el = {};
function cacheDom() {
  ['bossEmoji', 'bossNameText', 'bossNick', 'bossNo', 'hpWrap', 'hpFill', 'hpText', 'hpApprox', 'hpPct',
   'players', 'peak', 'myTotal', 'myTitle', 'myDmg', 'myDmgPct', 'killCount', 'dps', 'muteBtn', 'infoBtn',
   'setupBanner', 'banner', 'app', 'fxCanvas', 'popLayer', 'hitfxLayer', 'shakeWrap',
   'clickArea', 'weakMarker', 'bossSpeech', 'bossIntro'].forEach((k) => { el[k] = document.getElementById(k); });
}

// ---------------- 描画 ----------------
function targetHp() { return Math.max(0, serverHp - pendingDmg - inFlight); }

function render() {
  const t = targetHp();
  shownHp += (t - shownHp) * 0.25;
  if (Math.abs(shownHp - t) < 1) shownHp = t;

  const pct = boss.maxHp > 0 ? (shownHp / boss.maxHp) * 100 : 0;
  el.hpFill.style.width = pct.toFixed(3) + '%';
  el.hpText.textContent = fmt(shownHp);
  el.hpApprox.textContent = `約 ${jpShort(shownHp)} / ${jpShort(boss.maxHp)}`;
  el.hpPct.textContent = pct.toFixed(pct < 10 ? 2 : 1) + '%';
  el.hpWrap.classList.toggle('crit', pct > 0 && pct < 15 && !PREFS.lowStim);
  updateBossVisual(pct);

  el.myTotal.textContent = fmt(LS.total);
  el.myTitle.textContent = titleFor(LS.dmgTotal).name;
  el.myDmg.textContent = fmt(myBossDamage);
  const dp = boss.maxHp > 0 ? (myBossDamage / boss.maxHp) * 100 : 0;
  el.myDmgPct.textContent = dp < 0.01 && dp > 0 ? '<0.01%' : dp.toFixed(2) + '%';
  el.killCount.textContent = fmt(defeatedCount);
  el.peak.textContent = fmt(peakPlayers);

  requestAnimationFrame(render);
}
// 弱点の出現/消滅は rAF に依存させない
setInterval(() => { if (ready) tickWeak(performance.now()); }, 250);

function paintBoss() {
  document.documentElement.style.setProperty('--boss-hue', boss.hue);
  el.bossEmoji.textContent = boss.emoji;
  const nk = LS.nick(boss.index);
  el.bossNameText.textContent = nk || boss.name;
  el.bossNick.hidden = !nk;
  el.bossNo.textContent = `BOSS #${boss.index + 1}`;
}

// ---------------- サーバー行の反映 ----------------
function handleServerRow(row) {
  if (!row) return;
  defeatedCount = row.defeated_count ?? defeatedCount;
  if (row.peak_players != null) peakPlayers = Math.max(peakPlayers, row.peak_players);

  const now = performance.now();
  if (lastRowHp != null && row.boss_index === boss.index) {
    const drop = lastRowHp - row.hp;
    if (drop > 0) dpsSamples.push({ drop, t: now });
  }
  lastRowHp = row.hp;

  if (row.boss_index > boss.index) { onBossDefeated(row.boss_index, row.hp); return; }
  if (row.boss_index < boss.index) return;

  const predicted = serverHp;
  serverHp = row.hp;
  const extra = predicted - row.hp - justFlushed;
  justFlushed = 0;
  if (extra > 0 && ready) flashOthers(extra);
}

function updateDps() {
  const now = performance.now();
  dpsSamples = dpsSamples.filter((s) => now - s.t < 3000);
  const sum = dpsSamples.reduce((a, s) => a + s.drop, 0);
  const dps = dpsSamples.length ? sum / 3 : 0;
  el.dps.textContent = fmt(dps) + ' /秒';
  if (dps > LS.bestDps) LS.bestDps = Math.round(dps);
}
setInterval(updateDps, 500);

// 累計プレイ時間 + 定期的な実績チェック
setInterval(() => {
  if (!document.hidden) LS.playSec = LS.playSec + 1;
}, 1000);
setInterval(() => checkAchievements(statsSnapshot()), 5000);

function statsSnapshot() {
  return {
    clicks: LS.total, dmgTotal: LS.dmgTotal, kills: LS.kills,
    sessionDmg, weakHits: LS.weakHits, bestPct: LS.bestPct,
    petStage: petStageNow(), skinsSeen: LS.skinsSeen().size,
    playSec: LS.playSec, bestDps: LS.bestDps,
  };
}

// ---------------- 他プレイヤーのタップ ----------------
function showRemoteTap(nx, ny) {
  if (PREFS.lowStim) return;
  const r = el.clickArea.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'remote-tap';
  d.style.left = (r.left + nx * r.width) + 'px';
  d.style.top = (r.top + ny * r.height) + 'px';
  el.hitfxLayer.appendChild(d);
  setTimeout(() => d.remove(), 500);
}

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
  if (contributed) LS.kills = LS.kills + 1;

  recordDefeat({ index: beaten.index, name: LS.nick(beaten.index) || beaten.name, myDmg: myBossDamage, myMax: beaten.maxHp });

  playFanfare();
  fireworks(4200);
  bossDefeatSeq(beaten.emoji);
  petCelebrate();
  showBanner(
    `💥 ${LS.nick(beaten.index) || beaten.name} を撃破！ 💥`,
    contributed
      ? `あなたのダメージ ${fmt(myBossDamage)}(${((myBossDamage / beaten.maxHp) * 100).toFixed(2)}%)`
      : '世界中のプレイヤーが討伐しました'
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
  setTimeout(() => bossIntro(LS.nick(boss.index) || boss.name, boss.emoji, boss.index + 1), 700);
  checkAchievements(statsSnapshot());
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
let lastSnd = 0;

function hit(ev) {
  if (!ready) return;

  // クリック位置(クリック領域内の正規化座標)
  const r = el.clickArea.getBoundingClientRect();
  let cx = r.left + r.width / 2, cy = r.top + r.height * 0.4;
  if (ev && ev.clientX != null) { cx = ev.clientX; cy = ev.clientY; }
  const nx = Math.min(1, Math.max(0, (cx - r.left) / r.width));
  const ny = Math.min(1, Math.max(0, (cy - r.top) / r.height));

  const weak = isWeakHit(nx, ny);
  const dmg = weak ? 2 : 1;

  pendingDmg += dmg;
  myBossDamage += dmg;
  sessionDmg += dmg;
  LS.total = LS.total + 1;
  LS.dmgTotal = LS.dmgTotal + dmg;
  LS.curDmg = myBossDamage;
  if (weak) LS.weakHits = LS.weakHits + 1;

  const pct = boss.maxHp > 0 ? (myBossDamage / boss.maxHp) * 100 : 0;
  if (pct > LS.bestPct) LS.bestPct = +pct.toFixed(3);

  // ダメージポップ
  const now = performance.now();
  if (weak) {
    popDamage(cx, cy, '会心! -2', 'weak');
  } else {
    comboSum += dmg;
    if (now - comboTimer > 70) {
      comboTimer = now;
      popDamage(cx, cy, '-' + comboSum, 'me');
      comboSum = 0;
    }
  }

  hitEffect(cx, cy);
  if (now - lastSnd > 40) { playHit(); lastSnd = now; }
  shake(weak ? 6 : 2.4);
  bumpBoss(weak ? 0.82 : 0.9);
  if (taps) taps.send(+nx.toFixed(3), +ny.toFixed(3));
}

let bumpT = 0;
function bumpBoss(scale = 0.82) {
  el.bossEmoji.style.transform = `scale(${scale})`;
  clearTimeout(bumpT);
  bumpT = setTimeout(() => { el.bossEmoji.style.transform = ''; }, 90);
}

// ---------------- フラッシュ(送信)----------------
async function flush() {
  if (!ready || !backendOk || pendingDmg <= 0 || inFlight > 0) return;
  inFlight = pendingDmg;
  pendingDmg = 0;
  const { data, error } = await sendHit(inFlight, playersLive);
  if (error) {
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
  peakPlayers = Math.max(peakPlayers, data.peak_players || 0);
  lastRowHp = data.hp;
  if (LS.curIndex === boss.index && !changed) myBossDamage = LS.curDmg;
  else { myBossDamage = 0; LS.curIndex = boss.index; LS.curDmg = 0; }
  paintBoss();
}

// ---------------- 起動 ----------------
async function boot() {
  cacheDom();
  loadPrefs();

  // v1.4.0 移行: 累計ダメージが未記録なら、それまでの累計クリック数を引き継ぐ
  // (v1.3.x 以前は1クリック=1ダメージだったため)
  if (localStorage.getItem('bossraid_dmgTotal') === null && LS.total > 0) {
    LS.dmgTotal = LS.total;
  }
  initCanvas(el.fxCanvas);
  initPopLayer(el.popLayer);
  initShake(el.shakeWrap);
  initHitFx(el.hitfxLayer);
  initBossFx({
    area: el.clickArea, emoji: el.bossEmoji, wrap: el.shakeWrap,
    marker: el.weakMarker, speech: el.bossSpeech, intro: el.bossIntro,
  });

  setMuted(LS.muted);
  paintMuteBtn();
  el.muteBtn.addEventListener('click', toggleMute);
  el.infoBtn.addEventListener('click', showInfo);

  buildSkinGrid();
  applySkin(LS.skin);

  initPet();

  const skinPanel = document.getElementById('skinPanel');
  document.getElementById('skinBtn').addEventListener('click', toggleSkinPanel);
  document.getElementById('skinClose').addEventListener('click', () => skinPanel.classList.remove('show'));
  skinPanel.addEventListener('click', (e) => { if (e.target === skinPanel) skinPanel.classList.remove('show'); });

  initSettings({
    onChange: () => { paintBoss(); },
    nick: {
      currentIndex: () => boss.index,
      realName: (i) => bossFor(i).name,
      get: (i) => LS.nick(i),
      set: (i, name) => LS.setNick(i, name),
    },
  });
  initRecords({ getStats: statsSnapshot });

  initKeybinds({
    attack: () => hit(),
    pet: () => pokePet(),
    skin: () => toggleSkinPanel(),
    mute: () => toggleMute(),
  });

  el.clickArea.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(e); }, { passive: false });

  if (LS.curIndex === boss.index) myBossDamage = LS.curDmg;
  else { LS.curIndex = boss.index; LS.curDmg = 0; }

  render();
  paintBoss();
  ready = true;

  const { data } = await fetchState();
  if (data) { applyInitialState(data); backendOk = true; }
  else { el.setupBanner.classList.add('show'); scheduleReconnect(); }

  subscribeState((row) => { backendOk = true; handleServerRow(row); });
  joinPresence((n) => { playersLive = n; el.players.textContent = fmt(n); });
  taps = joinTaps({ onTap: (p) => showRemoteTap(p.x, p.y) });

  setInterval(flush, FLUSH_INTERVAL);
  window.addEventListener('beforeunload', flush);

  registerSW();
}

// ---------------- スキン ----------------
function applySkin(id) {
  const skin = SKINS.find((s) => s.id === id) || SKINS[0];
  const root = document.documentElement;
  SKIN_PROPS.forEach((p) => root.style.removeProperty(p));
  for (const [k, v] of Object.entries(skin.vars)) root.style.setProperty(k, v);
  LS.skin = skin.id;
  LS.addSkinSeen(skin.id);
  document.querySelectorAll('.skin-swatch').forEach((b) => b.classList.toggle('sel', b.dataset.id === skin.id));
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

// ---------------- トグル系 ----------------
function paintMuteBtn() { el.muteBtn.textContent = isMuted() ? '🔇 音 OFF' : '🔊 音 ON'; }
function toggleMute() { setMuted(!isMuted()); LS.muted = isMuted(); paintMuteBtn(); }
function toggleSkinPanel() { document.getElementById('skinPanel').classList.toggle('show'); }

function showInfo() {
  const rows = VERSION_HISTORY.slice().reverse()
    .map((v) => `<li><b>v${v.version}</b> <span>${v.date}</span><br>${v.notes}</li>`).join('');
  el.banner.innerHTML = `
    <div class="banner-title">BOSS RAID <small>v${CURRENT_VERSION}</small></div>
    <div class="banner-sub info-sub">
      1億HPのボスを世界中のプレイヤーとリアルタイム協力で連打して倒すゲーム。
      倒すたび少しずつ強い次のボスが無限に出現します。<br>
      画面のどこをクリック/タップしてもOK。ときどき光る<b>弱点</b>を叩くとダメージ2倍。
      <ul class="ver">${rows}</ul>
    </div>`;
  el.banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.banner.classList.remove('show'), 9000);
}

// ---------------- PWA ----------------
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          const t = document.createElement('div');
          t.className = 'ach-toast show';
          t.innerHTML = '⬆️ <b>新バージョンがあります</b><br><span>タップして更新</span>';
          t.style.cursor = 'pointer';
          t.addEventListener('click', () => location.reload());
          document.body.appendChild(t);
        }
      });
    });
  }).catch(() => {});
}

boot();
