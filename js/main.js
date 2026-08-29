import { FLUSH_INTERVAL } from './config.js';
import { bossFor, bossName } from './bosses.js';
import { fetchState, sendHit, subscribeState, joinPresence, joinLive } from './net.js';
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
  initBossFx, updateBossVisual, tickWeak, isWeakHit, tryWeakKey, bossIntro, bossDefeatSeq,
} from './bossfx.js';
import { initRecords, checkAchievements, recordDefeat, titleFor } from './records.js';
import { initI18n, t, fmtNum, fmtCompact, currentLang, onLangChange } from './i18n.js';

const SPECTATE = new URLSearchParams(location.search).has('spectate');

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

const bossLabel = (b) => LS.nick(b.index) || bossName(b);

// ---------------- 状態 ----------------
let boss = bossFor(0);
let authHp = boss.maxHp;
let displayHp = boss.maxHp;
let shownHp = boss.maxHp;
let pendingDmg = 0;
let inFlight = 0;
let defeatedCount = 0;
let myBossDamage = 0;
let sessionDmg = 0;
let peakPlayers = 0;
let playersLive = 1;
let curDps = 0;
let ready = false;
let backendOk = false;
let live = null;
let lastForce = 0;
let dpsSamples = [];

// ---------------- DOM ----------------
const el = {};
function cacheDom() {
  ['bossEmoji', 'bossNameText', 'bossNick', 'bossNo', 'hpWrap', 'hpFill', 'hpText', 'hpApprox', 'hpPct',
   'hudLine', 'myTotal', 'myTitle', 'myDmg', 'myDmgWrap', 'muteBtn', 'infoBtn',
   'setupBanner', 'banner', 'app', 'fxCanvas', 'popLayer', 'hitfxLayer', 'shakeWrap',
   'clickArea', 'weakMarker', 'bossSpeech', 'bossIntro'].forEach((k) => { el[k] = document.getElementById(k); });
}

// ---------------- HUD ----------------
function paintHud() {
  const b = (n) => '<b>' + fmtNum(n) + '</b>';
  el.hudLine.innerHTML = t('hud.line', {
    players: b(playersLive), kills: b(defeatedCount), dps: b(curDps), peak: b(peakPlayers),
  });
}

// ---------------- 描画 ----------------
function render() {
  shownHp += (displayHp - shownHp) * 0.5;
  if (Math.abs(shownHp - displayHp) < 1) shownHp = displayHp;

  const pct = boss.maxHp > 0 ? (shownHp / boss.maxHp) * 100 : 0;
  el.hpFill.style.width = pct.toFixed(3) + '%';
  el.hpText.textContent = fmtNum(shownHp);
  el.hpApprox.textContent = t('stage.hpOf', { cur: fmtCompact(shownHp), max: fmtCompact(boss.maxHp) });
  el.hpPct.textContent = pct.toFixed(pct < 10 ? 2 : 1) + '%';
  el.hpWrap.classList.toggle('crit', pct > 0 && pct < 15 && !PREFS.lowStim);
  updateBossVisual(pct);

  el.myTotal.textContent = fmtNum(LS.total);
  el.myTitle.textContent = titleFor(LS.dmgTotal).name;
  el.myDmg.textContent = fmtNum(myBossDamage);
  const dp = boss.maxHp > 0 ? (myBossDamage / boss.maxHp) * 100 : 0;
  const dpStr = dp < 0.01 && dp > 0 ? '<0.01%' : dp.toFixed(2) + '%';
  el.myDmgWrap.innerHTML = t('contrib.ofTotal', { pct: '<span>' + dpStr + '</span>' });

  requestAnimationFrame(render);
}
setInterval(() => { if (ready) tickWeak(performance.now()); }, 250);

function paintBoss() {
  document.documentElement.style.setProperty('--boss-hue', boss.hue);
  el.bossEmoji.textContent = boss.emoji;
  const nk = LS.nick(boss.index);
  el.bossNameText.textContent = nk || bossName(boss);
  el.bossNick.hidden = !nk;
  el.bossNo.textContent = `BOSS #${boss.index + 1}`;
}

// ---------------- サーバー行の反映 ----------------
function handleServerRow(row) {
  if (!row) return;
  defeatedCount = row.defeated_count ?? defeatedCount;
  if (row.peak_players != null) peakPlayers = Math.max(peakPlayers, row.peak_players);

  if (row.boss_index > boss.index) { onBossDefeated(row.boss_index, row.hp); return; }
  if (row.boss_index < boss.index) return;

  authHp = row.hp;
  if (authHp < displayHp) displayHp = authHp;
  else if (authHp - displayHp > 4) displayHp += (authHp - displayHp) * 0.12;
}

function updateDps() {
  const now = performance.now();
  dpsSamples = dpsSamples.filter((s) => now - s.t < 3000);
  const sum = dpsSamples.reduce((a, s) => a + s.drop, 0);
  curDps = dpsSamples.length ? Math.round(sum / 3) : 0;
  if (curDps > LS.bestDps) LS.bestDps = curDps;
  paintHud();
}
setInterval(updateDps, 500);

setInterval(() => { if (!document.hidden && !SPECTATE) LS.playSec = LS.playSec + 1; }, 1000);
setInterval(() => { if (!SPECTATE) checkAchievements(statsSnapshot()); }, 5000);

function statsSnapshot() {
  return {
    clicks: LS.total, dmgTotal: LS.dmgTotal, kills: LS.kills,
    sessionDmg, weakHits: LS.weakHits, bestPct: LS.bestPct,
    petStage: petStageNow(), skinsSeen: LS.skinsSeen().size,
    playSec: LS.playSec, bestDps: LS.bestDps,
  };
}

// ---------------- 他プレイヤーのダメージ ----------------
function onLiveDamage(p) {
  if (!p || p.b !== boss.index) return;
  const d = Math.max(0, p.d | 0);
  if (d <= 0) return;
  displayHp = Math.max(0, displayHp - d);
  dpsSamples.push({ drop: d, t: performance.now() });
  flashOthers(d);
  maybeForceReconcile();
}

async function forcePoll() {
  const { data } = await fetchState();
  if (data) handleServerRow(data);
}
function maybeForceReconcile() {
  if (displayHp > 0 || !backendOk) return;
  const now = performance.now();
  if (now - lastForce < 600) return;
  lastForce = now;
  if (pendingDmg > 0 && inFlight === 0) flush();
  else forcePoll();
}

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
  if (n - othersTimer < 140) return;
  othersTimer = n;
  const r = el.bossEmoji.getBoundingClientRect();
  popDamage(r.left + r.width / 2, r.top + r.height * (0.28 + Math.random() * 0.3), '-' + fmtNum(amount), 'others');
  shake(2.5);
}

function onBossDefeated(newIndex, newHp) {
  const beaten = boss;
  const contributed = myBossDamage > 0;
  if (!SPECTATE) {
    if (contributed) LS.kills = LS.kills + 1;
    recordDefeat({
      index: beaten.index, myDmg: myBossDamage, myMax: beaten.maxHp,
      name: LS.nick(beaten.index) || '',
      slime: !!beaten.slime, prefixIdx: beaten.prefixIdx, creatureId: beaten.creatureId,
    });
  }

  playFanfare();
  fireworks(4200);
  bossDefeatSeq(beaten.emoji);
  petCelebrate();
  showBanner(
    t('defeat.banner', { name: bossLabel(beaten) }),
    contributed
      ? t('defeat.yours', { dmg: fmtNum(myBossDamage), pct: ((myBossDamage / beaten.maxHp) * 100).toFixed(2) + '%' })
      : t('defeat.world')
  );

  boss = bossFor(newIndex);
  authHp = newHp ?? boss.maxHp;
  displayHp = authHp;
  shownHp = boss.maxHp;
  pendingDmg = 0;
  myBossDamage = 0;
  dpsSamples = [];
  LS.curIndex = boss.index;
  LS.curDmg = 0;
  paintBoss();
  bumpBoss();
  setTimeout(() => bossIntro(bossLabel(boss), boss.emoji, boss.index + 1), 700);
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

  const r = el.clickArea.getBoundingClientRect();
  const pointer = ev && ev.clientX != null;
  let cx = r.left + r.width / 2, cy = r.top + r.height * 0.4;
  if (pointer) { cx = ev.clientX; cy = ev.clientY; }
  const nx = Math.min(1, Math.max(0, (cx - r.left) / r.width));
  const ny = Math.min(1, Math.max(0, (cy - r.top) / r.height));

  const weak = pointer ? isWeakHit(nx, ny) : tryWeakKey();
  const dmg = weak ? 2 : 1;

  displayHp = Math.max(0, displayHp - dmg);
  dpsSamples.push({ drop: dmg, t: performance.now() });

  if (!SPECTATE) {
    pendingDmg += dmg;
    myBossDamage += dmg;
    sessionDmg += dmg;
    LS.total = LS.total + 1;
    LS.dmgTotal = LS.dmgTotal + dmg;
    LS.curDmg = myBossDamage;
    if (weak) LS.weakHits = LS.weakHits + 1;
    if (live) live.reportDamage(dmg, boss.index);
    const pct = boss.maxHp > 0 ? (myBossDamage / boss.maxHp) * 100 : 0;
    if (pct > LS.bestPct) LS.bestPct = +pct.toFixed(3);
  }

  const now = performance.now();
  if (weak) {
    popDamage(cx, cy, t('stage.critPop', { n: dmg }), 'weak');
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
  if (!SPECTATE && pointer && live) live.sendTap(+nx.toFixed(3), +ny.toFixed(3));
  if (!SPECTATE && displayHp <= 0) maybeForceReconcile();
}

let bumpT = 0;
function bumpBoss(scale = 0.82) {
  el.bossEmoji.style.transform = `scale(${scale})`;
  clearTimeout(bumpT);
  bumpT = setTimeout(() => { el.bossEmoji.style.transform = ''; }, 90);
}

// ---------------- フラッシュ ----------------
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
  inFlight = 0;
  handleServerRow(data);
}

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
  authHp = data.hp;
  displayHp = data.hp;
  shownHp = data.hp;
  defeatedCount = data.defeated_count;
  peakPlayers = Math.max(peakPlayers, data.peak_players || 0);
  if (LS.curIndex === boss.index && !changed) myBossDamage = LS.curDmg;
  else { myBossDamage = 0; LS.curIndex = boss.index; LS.curDmg = 0; }
  paintBoss();
  paintHud();
}

// ---------------- 起動 ----------------
async function boot() {
  cacheDom();
  loadPrefs();
  await initI18n();

  if (!localStorage.getItem('bossraid_mig_dmg') && LS.total > LS.dmgTotal) LS.dmgTotal = LS.total;
  localStorage.setItem('bossraid_mig_dmg', '1');

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
      realName: (i) => bossName(bossFor(i)),
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
  paintHud();
  ready = true;

  onLangChange(() => {
    paintBoss(); paintHud(); paintMuteBtn(); buildSkinGrid();
    // render() は rAF 依存なので、言語変更で即変わるべき箇所はここでも更新
    el.hpApprox.textContent = t('stage.hpOf', { cur: fmtCompact(shownHp), max: fmtCompact(boss.maxHp) });
    el.hpText.textContent = fmtNum(shownHp);
    el.myTitle.textContent = titleFor(LS.dmgTotal).name;
    el.myTotal.textContent = fmtNum(LS.total);
    el.myDmg.textContent = fmtNum(myBossDamage);
    if (el.banner.classList.contains('show') && el.banner.dataset.info) showInfo();
  });

  const { data } = await fetchState();
  if (data) { applyInitialState(data); backendOk = true; }
  else { el.setupBanner.classList.add('show'); scheduleReconnect(); }

  subscribeState((row) => { backendOk = true; handleServerRow(row); });
  joinPresence((n) => { playersLive = n; paintHud(); }, { track: !SPECTATE });
  live = joinLive({ onDamage: onLiveDamage, onTap: (p) => showRemoteTap(p.x, p.y) });

  if (!SPECTATE) {
    setInterval(flush, FLUSH_INTERVAL);
    setInterval(() => { if (ready && displayHp <= 0) maybeForceReconcile(); }, 500);
    window.addEventListener('beforeunload', flush);
  } else {
    showSpectateBadge();
  }

  registerSW();
}

function showSpectateBadge() {
  const b = document.createElement('div');
  b.textContent = t('hud.spectate');
  b.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:80;'
    + 'background:var(--panel-bg);color:var(--panel-ink);border:1px solid var(--border);'
    + 'border-radius:999px;padding:5px 14px;font-size:11px;font-weight:700;pointer-events:none;max-width:92vw';
  document.body.appendChild(b);
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
    b.className = 'skin-swatch' + (s.id === LS.skin ? ' sel' : '');
    b.dataset.id = s.id;
    b.style.setProperty('--sw-acc', acc);
    b.innerHTML =
      `<span class="chip" style="background:linear-gradient(150deg,${bg0},${bg1})">${s.icon}</span>` +
      `<span class="nm">${t('skin.' + s.id)}</span>`;
    b.addEventListener('click', () => applySkin(s.id));
    grid.appendChild(b);
  }
}

// ---------------- トグル系 ----------------
function paintMuteBtn() { el.muteBtn.textContent = isMuted() ? '🔇 ' + t('nav.soundOff') : '🔊 ' + t('nav.soundOn'); }
function toggleMute() { setMuted(!isMuted()); LS.muted = isMuted(); paintMuteBtn(); }
function toggleSkinPanel() { document.getElementById('skinPanel').classList.toggle('show'); }

function showInfo() {
  const showNotes = currentLang() === 'ja';
  const rows = VERSION_HISTORY.slice().reverse()
    .map((v) => `<li><b>v${v.version}</b> <span>${v.date}</span>${showNotes ? '<br>' + v.notes : ''}</li>`).join('');
  el.banner.dataset.info = '1';
  el.banner.innerHTML = `
    <div class="banner-title">BOSS RAID <small>v${CURRENT_VERSION}</small></div>
    <div class="banner-sub info-sub">${t('help.body')}<ul class="ver">${rows}</ul></div>`;
  el.banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { el.banner.classList.remove('show'); delete el.banner.dataset.info; }, 12000);
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
          const toast = document.createElement('div');
          toast.className = 'ach-toast show';
          toast.innerHTML = t('sw.update');
          toast.style.cursor = 'pointer';
          toast.addEventListener('click', () => location.reload());
          document.body.appendChild(toast);
        }
      });
    });
  }).catch(() => {});
}

window.__br = () => ({
  bossIndex: boss.index, authHp, displayHp, shownHp,
  pendingDmg, inFlight, myBossDamage, playersLive, peakPlayers, backendOk, lang: currentLang(),
});

boot();
