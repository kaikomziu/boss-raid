// PC向けキーバインド。操作ごとに好きなキーを割り当てられる。
// 保存は localStorage の bossraid_keys。

import { t, onLangChange } from './i18n.js';

const KEY = 'bossraid_keys';

const ACTIONS = [
  { id: 'attack', def: ['Space', 'Enter'] },
  { id: 'pet',    def: ['KeyF'] },
  { id: 'skin',   def: ['KeyG'] },
  { id: 'mute',   def: ['KeyM'] },
];

const BLOCKED = new Set([
  'Escape', 'Tab', 'ContextMenu', 'CapsLock', 'NumLock', 'ScrollLock', 'Insert',
  'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
  'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
]);

const NAMES = {
  Space: 'Space', Enter: 'Enter', Backspace: 'Backspace', Delete: 'Delete',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'",
  BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=',
  Backquote: '`', IntlYen: '¥', IntlRo: '_',
};

let binds = null;
let capture = null; // { actionId }
const els = {};
let handlers = {};

function load() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
  binds = {};
  for (const a of ACTIONS) binds[a.id] = Array.isArray(saved[a.id]) ? saved[a.id] : a.def.slice();
}
function save() { localStorage.setItem(KEY, JSON.stringify(binds)); }

export function formatCode(code) {
  if (NAMES[code]) return NAMES[code];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return 'Num' + code.slice(6);
  if (code.startsWith('Numpad')) return 'Num' + code.slice(6);
  return code;
}

export function actionForCode(code) {
  for (const a of ACTIONS) if (binds[a.id].includes(code)) return a.id;
  return null;
}
export function isCapturing() { return !!capture; }


function rebuild() {
  els.list.innerHTML = '';
  for (const a of ACTIONS) {
    const row = document.createElement('div');
    row.className = 'kb-row';
    const keys = binds[a.id]
      .map((c) => `<kbd data-act="${a.id}" data-code="${c}">${formatCode(c)} <span class="kb-x">✕</span></kbd>`)
      .join('');
    const capturing = capture && capture.actionId === a.id;
    row.innerHTML =
      `<span class="kb-label">${t('kb.' + a.id)}</span>` +
      `<span class="kb-keys">${keys || `<em class="kb-none">${t('kb.none')}</em>`}` +
      (capturing
        ? `<span class="kb-capturing">${t('kb.capturing')} <small>${t('kb.cancelHint')}</small></span>`
        : `<button class="kb-add" data-act="${a.id}">${t('kb.add')}</button>`) +
      `</span>`;
    els.list.appendChild(row);
  }
  els.list.querySelectorAll('.kb-add').forEach((b) => {
    b.addEventListener('click', () => { capture = { actionId: b.dataset.act }; rebuild(); });
  });
  els.list.querySelectorAll('kbd').forEach((k) => {
    k.addEventListener('click', () => {
      const { act, code } = k.dataset;
      binds[act] = binds[act].filter((c) => c !== code);
      save(); rebuild();
    });
  });
}

function handleCaptureKey(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.code === 'Escape') { capture = null; rebuild(); return; }
  if (BLOCKED.has(e.code) || e.ctrlKey || e.metaKey || e.altKey) return;
  const act = capture.actionId;
  // 他の操作から同じキーを外して重複を防ぐ
  for (const id of Object.keys(binds)) binds[id] = binds[id].filter((c) => c !== e.code);
  if (!binds[act].includes(e.code)) binds[act].push(e.code);
  capture = null;
  save();
  rebuild();
}

export function initKeybinds(h) {
  handlers = h || {};
  load();

  const isPC = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  els.btn = document.getElementById('keybindBtn');
  els.panel = document.getElementById('keybindPanel');
  els.list = document.getElementById('keybindList');
  if (!isPC) { els.btn.style.display = 'none'; }

  els.btn.addEventListener('click', () => { capture = null; rebuild(); els.panel.classList.add('show'); });
  document.getElementById('keybindClose').addEventListener('click', () => {
    capture = null; els.panel.classList.remove('show');
  });
  els.panel.addEventListener('click', (e) => {
    if (e.target === els.panel) { capture = null; els.panel.classList.remove('show'); }
  });
  document.getElementById('keybindReset').addEventListener('click', () => {
    for (const a of ACTIONS) binds[a.id] = a.def.slice();
    capture = null; save(); rebuild();
  });

  rebuild();
  onLangChange(rebuild);

  window.addEventListener('keydown', (e) => {
    if (capture) { handleCaptureKey(e); return; }
    if (e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const act = actionForCode(e.code);
    if (!act) return;
    // キー設定パネルを開いている間はゲーム操作を無効。
    // スキンパネルを開いている間は「スキン」キー(閉じる用)だけ許可。
    if (document.querySelector('#keybindPanel.show')) return;
    if (document.querySelector('#skinPanel.show') && act !== 'skin') return;
    e.preventDefault();
    handlers[act] && handlers[act]();
  });
}
