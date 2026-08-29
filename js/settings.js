// ⚙ 設定パネル: 言語 / 攻撃エフェクト / クリック音 / ダメージ表示 / あだ名 / 低刺激モード
import { PREFS, savePrefs } from './prefs.js';
import { t, LANGS, currentLang, setLang, onLangChange } from './i18n.js';

const EFFECTS = ['slash', 'fire', 'punch', 'laser', 'cat', 'none'];
const SOUNDS = ['poko', 'sword', 'punch', 'beam', 'animal', 'none'];
const DMG_STYLES = ['pop', 'simple', 'mini', 'gothic'];

let cfg = {};
const els = {};

function fillSelect(sel, values, prefix, val) {
  sel.innerHTML = values.map((v) => `<option value="${v}">${t(prefix + '.' + v)}</option>`).join('');
  sel.value = val;
}

export function initSettings(c) {
  cfg = c || {};
  els.btn = document.getElementById('settingsBtn');
  els.panel = document.getElementById('settingsPanel');
  els.lang = document.getElementById('setLang');
  els.effect = document.getElementById('setEffect');
  els.sound = document.getElementById('setSound');
  els.dmg = document.getElementById('setDmg');
  els.low = document.getElementById('setLowStim');
  els.nick = document.getElementById('setNick');
  els.nickSave = document.getElementById('setNickSave');
  els.nickNote = document.getElementById('setNickNote');

  els.lang.innerHTML = LANGS.map((l) => `<option value="${l.code}">${l.name}</option>`).join('');
  els.lang.value = currentLang();
  els.lang.addEventListener('change', () => setLang(els.lang.value));

  els.low.checked = PREFS.lowStim;
  rebuildSelects();

  const commit = () => { savePrefs(); cfg.onChange && cfg.onChange(); };
  els.effect.addEventListener('change', () => { PREFS.effect = els.effect.value; commit(); });
  els.sound.addEventListener('change', () => { PREFS.sound = els.sound.value; commit(); });
  els.dmg.addEventListener('change', () => { PREFS.dmgStyle = els.dmg.value; commit(); });
  els.low.addEventListener('change', () => { PREFS.lowStim = els.low.checked; commit(); });

  els.nickSave.addEventListener('click', () => {
    cfg.nick.set(cfg.nick.currentIndex(), els.nick.value.trim().slice(0, 16));
    cfg.onChange && cfg.onChange();
  });

  els.btn.addEventListener('click', () => { refreshNick(); els.panel.classList.add('show'); });
  document.getElementById('settingsClose').addEventListener('click', () => els.panel.classList.remove('show'));
  els.panel.addEventListener('click', (e) => { if (e.target === els.panel) els.panel.classList.remove('show'); });

  onLangChange(() => { els.lang.value = currentLang(); rebuildSelects(); if (els.panel.classList.contains('show')) refreshNick(); });
}

function rebuildSelects() {
  fillSelect(els.effect, EFFECTS, 'effect', PREFS.effect);
  fillSelect(els.sound, SOUNDS, 'sound', PREFS.sound);
  fillSelect(els.dmg, DMG_STYLES, 'dmgst', PREFS.dmgStyle);
}

function refreshNick() {
  const idx = cfg.nick.currentIndex();
  els.nickNote.textContent = t('set.nickNote', { name: cfg.nick.realName(idx) });
  els.nick.value = cfg.nick.get(idx) || '';
}
