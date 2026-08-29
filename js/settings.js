// ⚙ その他設定パネル: 攻撃エフェクト / クリック音 / ダメージ表示 / あだ名 / 低刺激モード
import { PREFS, savePrefs } from './prefs.js';

const EFFECTS = [
  ['slash', '斬撃'], ['fire', '炎'], ['punch', 'パンチ'],
  ['laser', 'レーザー'], ['cat', '猫パンチ'], ['none', 'なし'],
];
const SOUNDS = [
  ['poko', 'ポコ'], ['sword', '剣'], ['punch', 'パンチ'],
  ['beam', 'ビーム'], ['animal', 'どうぶつ'], ['none', 'なし'],
];
const DMG_STYLES = [
  ['pop', 'ポップ'], ['simple', 'シンプル'], ['mini', 'ミニマル'], ['gothic', 'ゴシック'],
];

let cfg = {};
const els = {};

function fillSelect(sel, pairs, val) {
  sel.innerHTML = pairs.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  sel.value = val;
}

export function initSettings(c) {
  cfg = c || {};
  els.btn = document.getElementById('settingsBtn');
  els.panel = document.getElementById('settingsPanel');
  els.effect = document.getElementById('setEffect');
  els.sound = document.getElementById('setSound');
  els.dmg = document.getElementById('setDmg');
  els.low = document.getElementById('setLowStim');
  els.nick = document.getElementById('setNick');
  els.nickSave = document.getElementById('setNickSave');
  els.nickBoss = document.getElementById('setNickBoss');

  fillSelect(els.effect, EFFECTS, PREFS.effect);
  fillSelect(els.sound, SOUNDS, PREFS.sound);
  fillSelect(els.dmg, DMG_STYLES, PREFS.dmgStyle);
  els.low.checked = PREFS.lowStim;

  const commit = () => { savePrefs(); cfg.onChange && cfg.onChange(); };
  els.effect.addEventListener('change', () => { PREFS.effect = els.effect.value; commit(); });
  els.sound.addEventListener('change', () => { PREFS.sound = els.sound.value; commit(); });
  els.dmg.addEventListener('change', () => { PREFS.dmgStyle = els.dmg.value; commit(); });
  els.low.addEventListener('change', () => { PREFS.lowStim = els.low.checked; commit(); });

  els.nickSave.addEventListener('click', () => {
    const idx = cfg.nick.currentIndex();
    const v = els.nick.value.trim().slice(0, 16);
    cfg.nick.set(idx, v);
    cfg.onChange && cfg.onChange();
  });

  els.btn.addEventListener('click', () => { refreshNick(); els.panel.classList.add('show'); });
  document.getElementById('settingsClose').addEventListener('click', () => els.panel.classList.remove('show'));
  els.panel.addEventListener('click', (e) => { if (e.target === els.panel) els.panel.classList.remove('show'); });
}

function refreshNick() {
  const idx = cfg.nick.currentIndex();
  els.nickBoss.textContent = cfg.nick.realName(idx);
  els.nick.value = cfg.nick.get(idx) || '';
}
