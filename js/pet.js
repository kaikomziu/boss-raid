// ペット要素。クリック(ボスへのダメージ)とは完全に独立。
import { t, onLangChange } from './i18n.js';

const KEY = 'bossraid_pet';
const DEX = 'bossraid_petdex';

const SPECIES = [
  { id: 'dog',    stages: ['🥚', '🐶', '🐕', '🦮', '🐺'] },
  { id: 'cat',    stages: ['🥚', '🐱', '🐈', '🐈‍⬛', '🦁'] },
  { id: 'bird',   stages: ['🥚', '🐤', '🐦', '🦅', '🦉'] },
  { id: 'dragon', stages: ['🥚', '🦎', '🐊', '🐉', '🐲'] },
  { id: 'slime',  stages: ['🥚', '🫧', '🟩', '🟢', '👾'] },
  { id: 'rabbit', stages: ['🥚', '🐰', '🐇', '🌝', '🦄'] },
  { id: 'fox',    stages: ['🥚', '🦊', '🦝', '🐺', '🌟'] },
  { id: 'panda',  stages: ['🥚', '🐼', '🐻', '🐻‍❄️', '👑'] },
  { id: 'penguin', stages: ['🥚', '🐧', '🐧', '🦤', '❄️'] },
  { id: 'ghost',  stages: ['🥚', '👻', '👻', '🎃', '💀'] },
];
const STAGE_AFF = [0, 15, 60, 160, 420];
const ACCS = [
  { id: '', emoji: '', need: 0 },
  { id: 'ribbon', emoji: '🎀', need: 1 },
  { id: 'cap', emoji: '🧢', need: 2 },
  { id: 'glass', emoji: '🕶️', need: 3 },
  { id: 'crown', emoji: '👑', need: 4 },
];

const spName = (id) => t('petsp.' + id);
const stageName = (i) => t('petstage.' + i);
const accName = (id) => t('petacc.' + (id || 'none'));

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

export function petStageNow() { return pet ? stageIndex(pet.affection) : -1; }

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
  if (!pet) {
    els.adopt.hidden = false; els.main.hidden = true;
    els.toggle.textContent = '🥚';
    if (els.eggs.children.length !== SPECIES.length) buildEggs();
    else [...els.eggs.children].forEach((b, i) => { b.querySelector('small').textContent = spName(SPECIES[i].id); });
    return;
  }
  els.adopt.hidden = true; els.main.hidden = false;

  const sp = species();
  const prevStage = pet.stage ?? 0;
  const st = stageIndex(pet.affection);
  const emoji = sp.stages[st];

  if (st > prevStage) { pet.stage = st; save(); speak(t('pet.evolved')); pop('hop'); }

  els.toggle.textContent = emoji;
  els.avatar.textContent = emoji;
  els.acc.textContent = (ACCS.find((a) => a.id === (pet.acc || '')) || {}).emoji || '';
  els.stageName.textContent = t('pet.badge', { species: spName(sp.id), stage: stageName(st) });
  els.age.textContent = t('pet.age', { n: ageDays() });
  els.name.textContent = pet.name;

  const affInStage = pet.affection - STAGE_AFF[st];
  const affSpan = (STAGE_AFF[st + 1] ?? STAGE_AFF[st] + 100) - STAGE_AFF[st];
  els.affFill.style.width = Math.min(100, (affInStage / affSpan) * 100) + '%';
  els.hunFill.style.width = Math.max(0, 100 - pet.hunger) + '%';

  const hungry = pet.hunger > 75;
  els.avatar.classList.toggle('sad', hungry);
  els.hunFill.classList.toggle('warn', hungry);

  const feedLeft = 1800000 - (Date.now() - (pet.lastFed || 0));
  if (feedLeft > 0) { els.feed.disabled = true; els.feed.textContent = t('pet.feedWait', { n: Math.ceil(feedLeft / 60000) }); }
  else { els.feed.disabled = false; els.feed.textContent = t('pet.feed'); }

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
    b.title = locked ? t('petacc.lock', { stage: stageName(a.need) }) : accName(a.id);
    if (!locked) b.addEventListener('click', () => { pet.acc = a.id; save(); render(); });
    els.accRow.appendChild(b);
  }
}
function renderDex() {
  els.dex.textContent = t('pet.dex', { n: dexSet().size, max: SPECIES.length });
}

function doPet() {
  if (!pet) return;
  const now = Date.now();
  if (now - (pet.lastPet || 0) < 2200) return;
  pet.lastPet = now;
  pet.affection += pet.hunger > 75 ? 0.4 : 1.6;
  save();
  pop('wiggle');
  speak(t('pet.stroke' + (1 + Math.floor(Math.random() * 4))));
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
  speak(t('pet.eat'));
  render();
}

function rename() {
  if (!pet) return;
  const n = prompt(t('pet.renamePrompt'), pet.name);
  if (n && n.trim()) { pet.name = n.trim().slice(0, 12); save(); render(); }
}

function adopt(id) {
  const now = Date.now();
  pet = {
    species: id, name: spName(id),
    born: now, affection: 0, hunger: 8, acc: '',
    lastFed: 0, lastPet: 0, lastTick: now, stage: 0,
  };
  dexAdd(id);
  save();
  render();
  speak(t('pet.hello'));
  pop('hop');
}

export function pokePet() { doPet(); }

export function petCelebrate() {
  if (!pet) return;
  pet.affection += 4;
  save();
  pop('hop');
  speak(t('pet.cheer'));
  render();
}

function buildEggs() {
  els.eggs.innerHTML = '';
  for (const s of SPECIES) {
    const b = document.createElement('button');
    b.className = 'pet-egg';
    b.innerHTML = `<span>🥚</span><small>${spName(s.id)}</small>`;
    b.addEventListener('click', () => adopt(s.id));
    els.eggs.appendChild(b);
  }
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

  buildEggs();
  els.toggle.addEventListener('click', () => els.widget.classList.toggle('collapsed'));
  els.avatar.addEventListener('click', doPet);
  els.petBtn.addEventListener('click', doPet);
  els.feed.addEventListener('click', doFeed);
  els.name.addEventListener('click', rename);

  load();
  tick();
  render();
  setInterval(tick, 15000);
  onLangChange(() => { buildEggs(); render(); });
}
