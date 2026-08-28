// 演出まわり: 効果音 / 花火 / ダメージポップ / 画面揺れ
let actx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ac() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

// ポコッ(クリック音)
export function playPoko() {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(420 + Math.random() * 120, t);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.09);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.28, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.14);
}

// 撃破ファンファーレ
export function playFanfare() {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => {
    const t = t0 + i * 0.13;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.42);
  });
  // 締めの和音
  const tE = t0 + notes.length * 0.13;
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, tE);
    g.gain.exponentialRampToValueAtTime(0.18, tE + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, tE + 1.1);
    o.connect(g); g.connect(c.destination);
    o.start(tE); o.stop(tE + 1.15);
  });
}

// ---------- 花火 ----------
let canvas, ctx, parts = [], raf = 0, running = false;

export function initCanvas(el) {
  canvas = el;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}
function resize() {
  if (!canvas) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function burst(x, y) {
  const hue = Math.random() * 360;
  const n = 60 + Math.floor(Math.random() * 40);
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    const sp = 2 + Math.random() * 5;
    parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      decay: 0.008 + Math.random() * 0.02,
      hue: hue + Math.random() * 40 - 20,
      size: 2 + Math.random() * 2,
    });
  }
}

function loop() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(6,8,20,0.22)';
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.globalCompositeOperation = 'lighter';
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.vy += 0.045;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    ctx.fillStyle = `hsla(${p.hue},100%,${55 + p.life * 25}%,${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  if (parts.length || running) {
    raf = requestAnimationFrame(loop);
  } else {
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}

export function fireworks(ms = 4200) {
  if (!ctx) return;
  running = true;
  const start = performance.now();
  const iv = setInterval(() => {
    if (performance.now() - start > ms) { clearInterval(iv); running = false; return; }
    burst(innerWidth * (0.15 + Math.random() * 0.7), innerHeight * (0.12 + Math.random() * 0.45));
  }, 220);
  for (let i = 0; i < 3; i++) burst(innerWidth * (0.25 + i * 0.25), innerHeight * 0.3);
  cancelAnimationFrame(raf);
  loop();
}

// ---------- ダメージポップ ----------
let popLayer;
export function initPopLayer(el) { popLayer = el; }

export function popDamage(x, y, text, kind = 'me') {
  if (!popLayer) return;
  const d = document.createElement('div');
  d.className = 'dmg dmg-' + kind;
  d.textContent = text;
  const jx = (Math.random() * 2 - 1) * 26;
  d.style.left = x + jx + 'px';
  d.style.top = y + 'px';
  popLayer.appendChild(d);
  setTimeout(() => d.remove(), 900);
}

// ---------- 画面揺れ ----------
let shakeEl, shakeT = 0;
export function initShake(el) { shakeEl = el; }
export function shake(power = 6) {
  if (!shakeEl) return;
  shakeT = Math.min(shakeT + power, 16);
  if (shakeT === power) tick();
}
function tick() {
  if (shakeT <= 0.3) { shakeEl.style.transform = ''; shakeT = 0; return; }
  const x = (Math.random() * 2 - 1) * shakeT;
  const y = (Math.random() * 2 - 1) * shakeT;
  shakeEl.style.transform = `translate(${x}px,${y}px)`;
  shakeT *= 0.86;
  requestAnimationFrame(tick);
}
