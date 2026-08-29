// 攻撃エフェクト。クリック位置に短命のスプライトを出すだけ(ダメージには無関係)。
import { PREFS } from './prefs.js';

let layer = null;
export function initHitFx(el) { layer = el; }

function spawn(html, x, y, cls, life = 480) {
  const d = document.createElement('div');
  d.className = 'hitfx ' + cls;
  d.style.left = x + 'px';
  d.style.top = y + 'px';
  d.innerHTML = html;
  layer.appendChild(d);
  setTimeout(() => d.remove(), life);
}

export function hitEffect(x, y) {
  if (!layer || PREFS.lowStim || PREFS.effect === 'none') return;
  const jitter = () => (Math.random() * 2 - 1) * 10;
  switch (PREFS.effect) {
    case 'fire':
      for (let i = 0; i < 4; i++) spawn('', x + jitter(), y + jitter(), 'fx-fire', 520);
      break;
    case 'punch':
      spawn('💥', x, y, 'fx-punch', 420);
      break;
    case 'laser':
      spawn('<span class="fx-laser-line"></span>', x, y, 'fx-laser', 300);
      break;
    case 'cat':
      spawn('🐾', x + jitter(), y + jitter(), 'fx-cat', 520);
      break;
    default: // slash
      spawn('<span class="fx-slash-line" style="--r:' + (Math.random() * 90 - 45) + 'deg"></span>', x, y, 'fx-slash', 340);
  }
}
