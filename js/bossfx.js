// ボスの見た目まわり:
//  #1 HP帯でダメージ表現   #2 撃破シーケンス   #3 登場アニメ
//  #5 弱点部位(当たると2倍)  #28 ボスのセリフ
import { PREFS } from './prefs.js';

const els = {};
let curName = '';
let saidMilestone = -1;
let idleTimer = null;

const LINES = {
  intro: ['よくぞ来たな…', 'ほう、挑む気か', '返り討ちにしてくれる', 'この地は通さん'],
  idle:  ['まだまだ！', '効かぬなァ', 'その程度か？', 'もっと来い', 'ぬるいわ', 'くらえ！'],
  m50:   ['やるではないか…', 'ぐ…本気を出すか', 'ここからが本番だ'],
  m20:   ['ばかな、この私が…', 'うぬぬ…！', 'まだ倒れぬ！'],
};

export function initBossFx(refs) {
  Object.assign(els, refs); // { area, emoji, wrap, marker, speech, intro }
  els.marker.addEventListener('pointerdown', (e) => e.stopPropagation(), true);
  scheduleIdleLine();
}

// ---- #1 HP帯で見た目変化(render から毎フレーム) ----
export function updateBossVisual(pct) {
  const lvl = pct > 75 ? 0 : pct > 50 ? 1 : pct > 25 ? 2 : 3;
  if (els.emoji.dataset.hurt !== String(lvl)) els.emoji.dataset.hurt = lvl;
  els.wrap.style.setProperty('--hurt', Math.max(0, 1 - pct / 100).toFixed(2));
  els.emoji.classList.toggle('boss-dying', pct > 0 && pct < 18 && !PREFS.lowStim);

  const ms = pct <= 20 ? 20 : pct <= 50 ? 50 : 100;
  if (ms < 100 && saidMilestone !== ms) {
    saidMilestone = ms;
    say(ms === 20 ? pick(LINES.m20) : pick(LINES.m50));
  }
}

// ---- #5 弱点 ----
const weak = { active: false, x: 0.5, y: 0.4, until: 0, nextAt: 3000 };
export function tickWeak(now) {
  if (weak.active) {
    if (now > weak.until) setWeak(false);
  } else if (now > weak.nextAt && !PREFS.lowStim) {
    setWeak(true);
  }
}
function setWeak(on) {
  weak.active = on;
  const now = performance.now();
  if (on) {
    weak.x = 0.22 + Math.random() * 0.56;
    weak.y = 0.16 + Math.random() * 0.58;
    weak.until = now + 3200 + Math.random() * 2600;
    els.marker.style.left = weak.x * 100 + '%';
    els.marker.style.top = weak.y * 100 + '%';
    els.marker.classList.add('show');
  } else {
    weak.nextAt = now + 7000 + Math.random() * 9000;
    els.marker.classList.remove('show');
  }
}
// area 内の正規化座標が弱点か? 当たったら弱点は消える
export function isWeakHit(nx, ny) {
  if (!weak.active) return false;
  if (Math.hypot(nx - weak.x, ny - weak.y) < 0.15) {
    setWeak(false);
    burstMarker();
    return true;
  }
  return false;
}
function burstMarker() {
  const b = document.createElement('div');
  b.className = 'weak-burst';
  b.style.left = weak.x * 100 + '%';
  b.style.top = weak.y * 100 + '%';
  els.area.appendChild(b);
  setTimeout(() => b.remove(), 400);
}

// ---- #3 登場 ----
export function bossIntro(name, emoji, no) {
  curName = name;
  saidMilestone = -1;
  if (PREFS.lowStim) return;
  els.intro.innerHTML =
    `<div class="bi-no">BOSS #${no}</div><div class="bi-emoji">${emoji}</div><div class="bi-name">${name}</div>`;
  els.intro.classList.remove('play');
  void els.intro.offsetWidth;
  els.intro.classList.add('play');
  setTimeout(() => els.intro.classList.remove('play'), 1400);
  setTimeout(() => say(pick(LINES.intro)), 900);
}

// ---- #2 撃破 ----
export function bossDefeatSeq(emoji) {
  if (PREFS.lowStim) return;
  const flash = document.createElement('div');
  flash.className = 'defeat-flash';
  els.wrap.appendChild(flash);
  setTimeout(() => flash.remove(), 500);

  const fly = document.createElement('div');
  fly.className = 'boss-fly';
  fly.textContent = emoji;
  els.area.appendChild(fly);
  setTimeout(() => fly.remove(), 1000);
}

// ---- #28 セリフ ----
function say(text) {
  if (!els.speech || PREFS.lowStim) return;
  els.speech.textContent = text;
  els.speech.classList.add('show');
  clearTimeout(els.speech._t);
  els.speech._t = setTimeout(() => els.speech.classList.remove('show'), 2600);
}
function scheduleIdleLine() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!document.hidden && Math.random() < 0.7) say(pick(LINES.idle));
    scheduleIdleLine();
  }, 22000 + Math.random() * 20000);
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
