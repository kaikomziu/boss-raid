// ペット要素。クリック(ボスへのダメージ)とは完全に独立。
// 実時間経過 + なでる/ごはん でなかよし度が上がり、5段階に成長する。
// セーブは localStorage の bossraid_pet / bossraid_petdex。

const KEY = 'bossraid_pet';
const DEX = 'bossraid_petdex';

const SPECIES = [
  { id: 'dog',    name: 'いぬ',     stages: ['🥚', '🐶', '🐕', '🦮', '🐺'] },
  { id: 'cat',    name: 'ねこ',     stages: ['🥚', '🐱', '🐈', '🐈‍⬛', '🦁'] },
  { id: 'bird',   name: 'とり',     stages: ['🥚', '🐤', '🐦', '🦅', '🦉'] },
  { id: 'dragon', name: 'りゅう',   stages: ['🥚', '🦎', '🐊', '🐉', '🐲'] },
  { id: 'slime',  name: 'スライム', stages: ['🥚', '🫧', '🟩', '🟢', '👾'] },
  { id: 'rabbit', name: 'うさぎ',   stages: ['🥚', '🐰', '🐇', '🌝', '🦄'] },
  { id: 'fox',    name: 'きつね',   stages: ['🥚', '🦊', '🦝', '🐺', '🌟'] },
  { id: 'panda',  name: 'パンダ',   stages: ['🥚', '🐼', '🐻', '🐻‍❄️', '👑'] },
  { id: 'penguin',name: 'ペンギン', stages: ['🥚', '🐧', '🐧', '🦤', '❄️'] },
  { id: 'ghost',  name: 'おばけ',   stages: ['🥚', '👻', '👻', '🎃', '💀'] },
];
const STAGE_NAMES = ['たまご', 'ベビー', 'ジュニア', 'せいたい', 'でんせつ'];
const STAGE_AFF   = [0, 15, 60, 160, 420];

const ACCS = [
  { id: '', emoji: '', name: 'なし', need: 0 },
  { id: 'ribbon', emoji: '🎀', name: 'リボン', need: 1 },
  { id: 'cap',    emoji: '🧢', name: 'ぼうし', need: 2 },
  { id: 'glass',  emoji: '🕶️', name: 'サングラス', need: 3 },
  { id: 'crown',  emoji: '👑', name: 'おうかん', need: 4 },
];

let pet = null;
const els = {};
let speechTimer = null;

function load() { try { pet = JSON.parse(localStorage.getItem(KEY)); } catch (_) { pet = null; } }
function save() { localStorage.setItem(KEY, JSON.stringify(pet)); }
function dexSet() { try { return new Set(JSON.parse(localStorage.getItem(DEX)) || []); } catch (_) { return new Set(); } }
function dexAdd(id) { const s = dexSet(); s.add(id); localStorage.setItem(DEX, JSON.stringify([...s])); }

function species() { return SPECIES.find((s) => s.id === pet.species) || SPECIES[0]; }
function stageIndex(aff) {
  let s = 0;
  for (let i = 0; i < STAGE_AFF.length; i++) if (aff >= STAGE_AFF[i]) s = i;
  return s;
}
function ageDays() { return Math.floor((Date.now() - pet.born) / 86400000); }

export function petStageNow() {
  if (!pet) return -1;
  return stageIndex(pet.affection);
}

function tick() {
  if (!pet) return;
  const now = Date.now();
  const dtH = (now - pet.lastTick) / 3600000;
  if (dtH > 0.003) {
    pet.hunger = Math.min(100, pet.hunger + dtH * 8);
    if (pet.hunger < 85) pet.affection += Math.min(dtH, 18) * 1.4;
    pet.lastTick = now;
    save();
  }
  render();
}

function speak(text) {
  if (!els.speech) return;
  els.speech.textContent = text;
  els.speech.classList.add('show');
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => els.speech.classList.remove('show'), 2600);
}
function pop(cls) {
  els.avatar.classList.remove('hop', 'wiggle');
  void els.avatar.offsetWidth;
  els.avatar.classList.add(cls);
}

function render() {
  if (!pet) { els.adopt.hidden = false; els.main.hidden = true; els.toggle.textContent = '🥚'; renderDex(); return; }
  els.adopt.hidden = true;
  els.main.hidden = false;

  const sp = species();
  const prevStage = pet.stage ?? 0;
  const st = stageIndex(pet.affection);
  const emoji = sp.stages[st];

  if (st > prevStage) {
    pet.stage = st;
    save();
    speak('しんかした！✨');
    pop('hop');
  }

  els.toggle.textContent = emoji;
  els.avatar.textContent = emoji;
  els.acc.textContent = ACCS.find((a) => a.id === (pet.acc || ''))?.emoji || '';
  els.stageName.textContent = `${sp.name}・${STAGE_NAMES[st]}`;
  els.age.textContent = `${ageDays()}日`;
  els.name.textContent = pet.name;

  const affInStage = pet.affection - STAGE_AFF[st];
  const affSpan = (STAGE_AFF[st + 1] ?? STAGE_AFF[st] + 100) - STAGE_AFF[st];
  els.affFill.style.width = Math.min(100, (affInStage / affSpan) * 100) + '%';
  els.hunFill.style.width = Math.max(0, 100 - pet.hunger) + '%';

  const hungry = pet.hunger > 75;
  els.avatar.classList.toggle('sad', hungry);
  els.hunFill.classList.toggle('warn', hungry);

  const feedLeft = 1800000 - (Date.now() - (pet.lastFed || 0));
  if (feedLeft > 0) { els.feed.disabled = true; els.feed.textContent = `🍖 ${Math.ceil(feedLeft / 60000)}分`; }
  else { els.feed.disabled = false; els.feed.textContent = '🍖 ごはん'; }

  renderAccPicker(st);
  renderDex();
}

function renderAccPicker(st) {
  els.accRow.innerHTML = '';
  for (const a of ACCS) {
    const b = document.createElement('button');
    const locked = st < a.need;
    b.className = 'pet-acc-btn' + (pet.acc === a.id || (!pet.acc && !a.id) ? ' on' : '') + (locked ? ' lock' : '');
    b.textContent = a.id ? a.emoji : '∅';
    b.title = locked ? `${STAGE_NAMES[a.need]}で解放` : a.name;
    if (!locked) b.addEventListener('click', () => { pet.acc = a.id; save(); render(); });
    els.accRow.appendChild(b);
  }
}
function renderDex() {
  const s = dexSet();
  els.dex.textContent = `ずかん ${s.size}/${SPECIES.length}種`;
}

function doPet() {
  if (!pet) return;
  const now = Date.now();
  if (now - (pet.lastPet || 0) < 2200) return;
  pet.lastPet = now;
  pet.affection += pet.hunger > 75 ? 0.4 : 1.6;
  save();
  pop('wiggle');
  speak(['なでなで♪', 'うれしい！', 'もっと！', 'ふふっ'][Math.floor(Math.random() * 4)]);
  render();
}

function doFeed() {
  if (!pet) return;
  const now = Date.now();
  if (now - (pet.lastFed || 0) < 1800000) return;
  pet.lastFed = now;
  pet.hunger = 0;
  pet.affection += 9;
  save();
  pop('hop');
  speak('もぐもぐ…おいしい！');
  render();
}

function rename() {
  if (!pet) return;
  const n = prompt('ペットのなまえ', pet.name);
  if (n && n.trim()) { pet.name = n.trim().slice(0, 12); save(); render(); }
}

function adopt(id) {
  const now = Date.now();
  pet = {
    species: id, name: SPECIES.find((s) => s.id === id).name,
    born: now, affection: 0, hunger: 8, acc: '',
    lastFed: 0, lastPet: 0, lastTick: now, stage: 0,
  };
  dexAdd(id);
  save();
  render();
  speak('よろしくね！');
  pop('hop');
}

export function pokePet() { doPet(); }

export function petCelebrate() {
  if (!pet) return;
  pet.affection += 4;
  save();
  pop('hop');
  speak('やったー！🎉');
  render();
}

export function initPet() {
  [
    ['toggle', 'petToggle'], ['panel', 'petPanel'], ['adopt', 'petAdopt'],
    ['eggs', 'petEggs'], ['main', 'petMain'], ['avatar', 'petAvatar'], ['acc', 'petAcc'],
    ['accRow', 'petAccRow'], ['dex', 'petDex'],
    ['speech', 'petSpeech'], ['name', 'petName'], ['stageName', 'petStageName'],
    ['age', 'petAge'], ['affFill', 'petAffFill'], ['hunFill', 'petHunFill'],
    ['petBtn', 'petPet'], ['feed', 'petFeed'], ['widget', 'petWidget'],
  ].forEach(([k, id]) => { els[k] = document.getElementById(id); });

  els.eggs.innerHTML = '';
  for (const s of SPECIES) {
    const b = document.createElement('button');
    b.className = 'pet-egg';
    b.innerHTML = `<span>🥚</span><small>${s.name}</small>`;
    b.addEventListener('click', () => adopt(s.id));
    els.eggs.appendChild(b);
  }

  els.toggle.addEventListener('click', () => els.widget.classList.toggle('collapsed'));
  els.avatar.addEventListener('click', doPet);
  els.petBtn.addEventListener('click', doPet);
  els.feed.addEventListener('click', doFeed);
  els.name.addEventListener('click', rename);

  load();
  tick();
  render();
  setInterval(tick, 15000);
}
