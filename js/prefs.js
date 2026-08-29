// 全モジュールが参照する設定シングルトン。
// settings.js が書き換え、fx / hitfx / bossfx / main が読む。
const KEY = 'bossraid_prefs';

export const PREFS = {
  effect: 'slash',   // none | slash | fire | punch | laser | cat
  sound: 'poko',     // none | poko | sword | punch | beam | animal
  dmgStyle: 'pop',   // pop | simple | mini | gothic
  lowStim: false,    // 低刺激モード(点滅・揺れ・花火・スローを抑制)
};

export function loadPrefs() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    for (const k of Object.keys(PREFS)) if (k in s) PREFS[k] = s[k];
  } catch (_) {}
}
export function savePrefs() {
  localStorage.setItem(KEY, JSON.stringify(PREFS));
}
