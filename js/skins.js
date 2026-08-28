// 画面スキン。applySkin() が vars を :root に流し込む。
// 未指定の変数は style.css の :root フォールバックが使われる。

const D = { // ダーク系の共通サーフェス
  '--surface': 'rgba(255,255,255,.05)',
  '--surface-2': 'rgba(255,255,255,.08)',
  '--border': 'rgba(255,255,255,.13)',
  '--panel-bg': 'rgba(14,16,26,.94)',
  '--panel-ink': '#eef1ff',
};
const L = { // ライト系の共通サーフェス
  '--surface': 'rgba(0,0,0,.045)',
  '--surface-2': 'rgba(0,0,0,.08)',
  '--border': 'rgba(0,0,0,.12)',
  '--panel-bg': 'rgba(255,255,255,.96)',
  '--panel-ink': '#1a1c28',
  '--pop-me': '#111827',
};

function dk(id, name, icon, bg0, bg1, acc, accd, extra = {}) {
  return { id, name, icon, vars: { '--bg0': bg0, '--bg1': bg1, '--ink': '#eef1ff', '--muted': '#8b93b8',
    '--skin-accent': acc, '--skin-accent-dim': accd, '--tint-alpha': '0.12', ...D, ...extra } };
}
function lt(id, name, icon, bg0, bg1, acc, accd, extra = {}) {
  return { id, name, icon, vars: { '--bg0': bg0, '--bg1': bg1, '--ink': '#20222e', '--muted': '#6b7192',
    '--skin-accent': acc, '--skin-accent-dim': accd, '--tint-alpha': '0.05', ...L, ...extra } };
}

export const SKINS = [
  // ボスの色に追従する既定スキン
  { id: 'boss', name: 'ボスカラー', icon: '👹', vars: { '--tint-alpha': '0.13' } },

  dk('neon',      'ネオンナイト',   '🌃', '#070912', '#0f1330', '#26e0ff', '#1478a8'),
  dk('midnight',  'ミッドナイト',   '🌌', '#050814', '#0a1440', '#5b7cff', '#3550c8'),
  dk('vapor',     'ヴェイパー',     '🌆', '#1a0b2e', '#2a1145', '#ff5fd1', '#c23bd0',
                  { '--muted': '#b48fd8' }),
  dk('magma',     'マグマ',         '🌋', '#160806', '#2c0d08', '#ff6a2b', '#c23c14'),
  dk('forest',    'フォレスト',     '🌲', '#08140d', '#0e2417', '#4be08a', '#2b9d5b'),
  dk('ocean',     'ディープシー',   '🌊', '#03121c', '#062338', '#22c7e0', '#127a95'),
  dk('space',     'コスモ',         '🪐', '#05060f', '#120a26', '#9a6bff', '#5c3ac8', { '--muted': '#9a93c8' }),
  dk('gold',      'ゴールドラッシュ','🪙', '#141006', '#251c08', '#ffcf3d', '#c29a14'),
  dk('rose',      'ダークローズ',   '🥀', '#160910', '#2a0f1e', '#ff5f8f', '#c23c66'),
  dk('mono',      'モノクロ',       '⬛', '#0a0a0a', '#1c1c1c', '#e8e8e8', '#8a8a8a', { '--muted': '#9a9a9a' }),
  dk('matrix',    'ターミナル',     '💻', '#000000', '#031a08', '#3dff7a', '#1d9c46',
                  { '--muted': '#3d8a55', '--ink': '#c9ffd6',
                    '--skin-font': '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace' }),
  dk('coffee',    'コーヒー',       '☕', '#140f0b', '#241a12', '#c98a4b', '#96602c', { '--muted': '#b89a80' }),
  dk('military',  'ミリタリー',     '🎖️', '#0e1109', '#1b2113', '#a5c23c', '#6e8524', { '--muted': '#98a37e' }),
  dk('sakura',    'よざくら',       '🌸', '#160b12', '#2a1322', '#ff9ec4', '#d16e97', { '--muted': '#c895ac' }),
  dk('aurora',    'オーロラ',       '❄️', '#04121a', '#0a2430', '#5cffc9', '#2ba98a', { '--muted': '#7fb8b0' }),

  lt('paper',     'ペーパー',       '📄', '#f4f1ea', '#e6e0d2', '#c2410c', '#9a3412'),
  lt('pastel',    'パステル',       '🍬', '#fdf2f8', '#e7f0ff', '#e05a9c', '#b83f7a'),
  lt('candy',     'キャンディ',     '🧁', '#fff5fb', '#ffe9f1', '#ff4d94', '#d62d76'),
  lt('sky',       'スカイ',         '🌤️', '#eef6ff', '#dcecff', '#0284c7', '#0369a1'),
  lt('mint',      'ミント',         '🌿', '#eefbf3', '#dcf3e6', '#0d9488', '#0f766e'),
  lt('lemon',     'レモン',         '🍋', '#fefce8', '#faf3d0', '#ca8a04', '#a16207'),
  lt('comic',     'コミック',       '💥', '#fffdf5', '#ffe8b0', '#e11d48', '#9f1239',
                  { '--border': 'rgba(0,0,0,.85)', '--ink': '#111', '--muted': '#444',
                    '--skin-font': '"Comic Sans MS", "Chalkboard SE", "Segoe UI", sans-serif' }),
  lt('sunset',    'サンセット',     '🌇', '#fff1e6', '#ffe0d0', '#ea580c', '#c2410c'),
];

export const SKIN_PROPS = [
  '--bg0', '--bg1', '--ink', '--muted', '--surface', '--surface-2', '--border',
  '--skin-accent', '--skin-accent-dim', '--tint-alpha', '--skin-font', '--pop-me',
  '--panel-bg', '--panel-ink',
];
