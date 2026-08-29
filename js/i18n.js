// ------------------------------------------------------------------
//  多言語対応 (16言語)
//  ja を基準に、他言語は js/lang/<code>.js を遅延ロードして上書き
// ------------------------------------------------------------------

export const LANGS = [
  { code: 'ja',    name: '日本語',            dir: 'ltr' },
  { code: 'en',    name: 'English',           dir: 'ltr' },
  { code: 'zh-CN', name: '简体中文',          dir: 'ltr' },
  { code: 'zh-TW', name: '繁體中文',          dir: 'ltr' },
  { code: 'ko',    name: '한국어',            dir: 'ltr' },
  { code: 'es',    name: 'Español',           dir: 'ltr' },
  { code: 'pt',    name: 'Português',         dir: 'ltr' },
  { code: 'fr',    name: 'Français',          dir: 'ltr' },
  { code: 'de',    name: 'Deutsch',           dir: 'ltr' },
  { code: 'ru',    name: 'Русский',           dir: 'ltr' },
  { code: 'it',    name: 'Italiano',          dir: 'ltr' },
  { code: 'tr',    name: 'Türkçe',            dir: 'ltr' },
  { code: 'pl',    name: 'Polski',            dir: 'ltr' },
  { code: 'vi',    name: 'Tiếng Việt',        dir: 'ltr' },
  { code: 'id',    name: 'Bahasa Indonesia',  dir: 'ltr' },
  { code: 'ar',    name: 'العربية',           dir: 'rtl' },
];

// Intl 用のロケール
const INTL = {
  ja: 'ja-JP', en: 'en-US', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', ko: 'ko-KR',
  es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR', de: 'de-DE', ru: 'ru-RU', it: 'it-IT',
  tr: 'tr-TR', pl: 'pl-PL', vi: 'vi-VN', id: 'id-ID', ar: 'ar',
};

// ---- 日本語(基準) ----
const JA = {
  'nav.skins': 'スキン', 'nav.settings': '設定', 'nav.records': 'きろく',
  'nav.keys': 'キー設定', 'nav.soundOn': '音 ON', 'nav.soundOff': '音 OFF',
  'nav.help': '遊び方', 'nav.moreGames': '作者の他のゲームで遊ぶ →',
  'common.close': '✕ 閉じる', 'common.save': '保存', 'common.reset': 'デフォルトに戻す',

  'hud.line': '今 {players} 人が戦っている ／ 討伐 {kills} ／ DPS {dps}/秒 ／ 最高 {peak} 人',
  'hud.spectate': '👁 観戦モード（この画面の操作は反映されません）',

  'setup.msg': '⚙️ Supabase の <code>boss_raid_state</code> テーブルがまだ作成されていません。<br>SQL を実行するとリアルタイム協力が有効になります(それまではローカル表示のみ)。',

  'stage.hpOf': '約 {cur} / {max}',
  'stage.hint': '画面をクリック / タップ、スペースキーでも殴れる ／ 光る<b>弱点</b>はダメージ2倍（キーボードは弱点の出現中に殴れば自動で会心）',
  'stage.weakKbd': '⌨ 会心',
  'stage.critPop': '会心! -{n}',

  'contrib.titleClicks': '称号 ／ 累計クリック',
  'contrib.bossDmg': 'このボスへのダメージ',
  'contrib.ofTotal': '全体の {pct}',

  'defeat.banner': '💥 {name} を撃破！ 💥',
  'defeat.yours': 'あなたのダメージ {dmg}（{pct}）',
  'defeat.world': '世界中のプレイヤーが討伐しました',

  'sw.update': '⬆️ <b>新バージョンがあります</b><br><span>タップして更新</span>',
  'ach.toast': '🏅 <b>実績かいじょ</b><br>{name} — <span>{desc}</span>',

  // 設定パネル
  'set.language': '言語 / Language',
  'set.effect': '攻撃エフェクト', 'set.sound': 'クリック音', 'set.dmgStyle': 'ダメージ表示',
  'set.lowStim': '低刺激モード', 'set.lowStimNote': '点滅・揺れ・花火を抑える',
  'set.nickTitle': 'ボスのあだ名', 'set.nickNote': '（{name} ／ 自分の画面だけ）',
  'set.nickPlaceholder': 'あだ名を入力（空で解除）',
  'effect.slash': '斬撃', 'effect.fire': '炎', 'effect.punch': 'パンチ', 'effect.laser': 'レーザー', 'effect.cat': '猫パンチ', 'effect.none': 'なし',
  'sound.poko': 'ポコ', 'sound.sword': '剣', 'sound.punch': 'パンチ', 'sound.beam': 'ビーム', 'sound.animal': 'どうぶつ', 'sound.none': 'なし',
  'dmgst.pop': 'ポップ', 'dmgst.simple': 'シンプル', 'dmgst.mini': 'ミニマル', 'dmgst.gothic': 'ゴシック',

  // きろくパネル
  'rec.tabAch': '実績', 'rec.tabTitle': '称号', 'rec.tabCodex': '討伐図鑑', 'rec.tabStats': '統計',
  'rec.count': '{got} / {total}',
  'rec.curTitle': '現在の称号',
  'rec.nextTitle': '次「{name}」まで あと {n}',
  'rec.maxTitle': '最高位に到達！',
  'rec.titleNeed': '累計 {n} ダメージ',
  'rec.here': '（いまここ）',
  'rec.codexEmpty': 'まだ討伐記録がありません',
  'stat.title': '称号', 'stat.clicks': '累計クリック', 'stat.dmg': '累計ダメージ',
  'stat.kills': '参加した討伐', 'stat.killsUnit': '{n} 体', 'stat.dps': '最高DPS', 'stat.dpsUnit': '{n} /秒',
  'stat.weak': '弱点ヒット', 'stat.weakUnit': '{n} 回', 'stat.bestPct': '最大貢献率',
  'stat.playtime': 'プレイ時間', 'stat.playtimeVal': '{h}時間 {m}分',

  // キー設定パネル
  'kb.attack': 'こうげき（ボスを殴る）', 'kb.pet': 'ペットをなでる',
  'kb.skin': 'スキンパネルを開閉', 'kb.mute': 'サウンド オン/オフ',
  'kb.add': '＋ 追加', 'kb.capturing': 'キーを押す…', 'kb.cancelHint': '(Escで中止)',
  'kb.none': 'なし', 'kb.tip': 'キーの「✕」で解除／複数キー登録OK',

  // ペット
  'pet.chooseEgg': 'タマゴをえらんでね', 'pet.name': 'なまえ',
  'pet.affection': 'なかよし', 'pet.hunger': 'おなか',
  'pet.strokeBtn': '🖐 なでる', 'pet.feed': '🍖 ごはん', 'pet.feedWait': '🍖 {n}分',
  'pet.dex': 'ずかん {n}/{max}種', 'pet.note': 'ダメージには影響しません',
  'pet.badge': '{species}・{stage}', 'pet.age': '{n}日',
  'pet.renamePrompt': 'ペットのなまえ',
  'pet.evolved': 'しんかした！✨', 'pet.hello': 'よろしくね！',
  'pet.eat': 'もぐもぐ…おいしい！', 'pet.cheer': 'やったー！🎉',
  'pet.stroke1': 'なでなで♪', 'pet.stroke2': 'うれしい！', 'pet.stroke3': 'もっと！', 'pet.stroke4': 'ふふっ',
  'petsp.dog': 'いぬ', 'petsp.cat': 'ねこ', 'petsp.bird': 'とり', 'petsp.dragon': 'りゅう', 'petsp.slime': 'スライム',
  'petsp.rabbit': 'うさぎ', 'petsp.fox': 'きつね', 'petsp.panda': 'パンダ', 'petsp.penguin': 'ペンギン', 'petsp.ghost': 'おばけ',
  'petstage.0': 'たまご', 'petstage.1': 'ベビー', 'petstage.2': 'ジュニア', 'petstage.3': 'せいたい', 'petstage.4': 'でんせつ',
  'petacc.none': 'なし', 'petacc.ribbon': 'リボン', 'petacc.cap': 'ぼうし', 'petacc.glass': 'サングラス', 'petacc.crown': 'おうかん',
  'petacc.lock': '{stage}で解放',

  // 遊び方
  'help.body': '1億HPのボスを世界中のプレイヤーとリアルタイム協力で連打して倒すゲーム。倒すたび少しずつ強い次のボスが無限に出現します。<br>画面のどこをクリック/タップしてもOK。ときどき光る<b>弱点</b>を叩くとダメージ2倍。キーボード操作なら、弱点が出ている間にこうげきキーを押せば自動で会心になります。',

  // ボスのセリフ
  'bl.intro.0': 'よくぞ来たな…', 'bl.intro.1': 'ほう、挑む気か', 'bl.intro.2': '返り討ちにしてくれる', 'bl.intro.3': 'この地は通さん',
  'bl.idle.0': 'まだまだ！', 'bl.idle.1': '効かぬなァ', 'bl.idle.2': 'その程度か？', 'bl.idle.3': 'もっと来い', 'bl.idle.4': 'ぬるいわ', 'bl.idle.5': 'くらえ！',
  'bl.m50.0': 'やるではないか…', 'bl.m50.1': 'ぐ…本気を出すか', 'bl.m50.2': 'ここからが本番だ',
  'bl.m20.0': 'ばかな、この私が…', 'bl.m20.1': 'うぬぬ…！', 'bl.m20.2': 'まだ倒れぬ！',

  // 称号
  'title.0': '村人', 'title.1': '見習い', 'title.2': '冒険者', 'title.3': '戦士',
  'title.4': '勇者', 'title.5': '英雄', 'title.6': '魔王殺し', 'title.7': '伝説', 'title.8': '神話',

  // 実績 (name / desc)
  'a.first.n': 'はじめの一撃', 'a.first.d': 'ボスを1体撃破',
  'a.kill10.n': '常連ハンター', 'a.kill10.d': 'ボスを10体撃破',
  'a.kill50.n': 'ボスクラッシャー', 'a.kill50.d': 'ボスを50体撃破',
  'a.kill100.n': '百戦錬磨', 'a.kill100.d': 'ボスを100体撃破',
  'a.kill500.n': '殲滅者', 'a.kill500.d': 'ボスを500体撃破',
  'a.clk1k.n': 'ウォームアップ', 'a.clk1k.d': '累計1,000クリック',
  'a.clk10k.n': '連打職人', 'a.clk10k.d': '累計10,000クリック',
  'a.clk100k.n': '指が仕事する', 'a.clk100k.d': '累計100,000クリック',
  'a.clk1m.n': 'ミリオンフィンガー', 'a.clk1m.d': '累計1,000,000クリック',
  'a.dmg1m.n': '削り役', 'a.dmg1m.d': '累計100万ダメージ',
  'a.dmg10m.n': '主砲', 'a.dmg10m.d': '累計1,000万ダメージ',
  'a.dmg100m.n': '一億の一員', 'a.dmg100m.d': '累計1億ダメージ',
  'a.ses1k.n': '本気の一戦', 'a.ses1k.d': '1回の来訪で1,000ダメージ',
  'a.ses10k.n': '入り浸り', 'a.ses10k.d': '1回の来訪で10,000ダメージ',
  'a.weak10.n': '目ざとい', 'a.weak10.d': '弱点を10回ヒット',
  'a.weak100.n': '弱点マスター', 'a.weak100.d': '弱点を100回ヒット',
  'a.contrib1.n': '一翼を担う', 'a.contrib1.d': '1体のボスに1%以上貢献',
  'a.contrib5.n': 'エース', 'a.contrib5.d': '1体のボスに5%以上貢献',
  'a.night.n': '夜ふかし戦士', 'a.night.d': '深夜0〜5時にプレイ',
  'a.petlegend.n': '名伯楽', 'a.petlegend.d': 'ペットをでんせつまで育てる',
  'a.skins5.n': '着せ替え好き', 'a.skins5.d': 'スキンを5種類ためす',
  'a.play1h.n': '腰を据えて', 'a.play1h.d': '累計プレイ1時間',

  // スキン名
  'skin.boss': 'ボスカラー', 'skin.neon': 'ネオンナイト', 'skin.midnight': 'ミッドナイト',
  'skin.vapor': 'ヴェイパー', 'skin.magma': 'マグマ', 'skin.forest': 'フォレスト',
  'skin.ocean': 'ディープシー', 'skin.space': 'コスモ', 'skin.gold': 'ゴールドラッシュ',
  'skin.rose': 'ダークローズ', 'skin.mono': 'モノクロ', 'skin.matrix': 'ターミナル',
  'skin.coffee': 'コーヒー', 'skin.military': 'ミリタリー', 'skin.sakura': 'よざくら',
  'skin.aurora': 'オーロラ', 'skin.paper': 'ペーパー', 'skin.pastel': 'パステル',
  'skin.candy': 'キャンディ', 'skin.sky': 'スカイ', 'skin.mint': 'ミント',
  'skin.lemon': 'レモン', 'skin.comic': 'コミック', 'skin.sunset': 'サンセット',

  // ボス名生成
  'boss.slime': 'スライム大王',
  'boss.format': '{prefix}{creature}',
  'bp.0': '暴虐の', 'bp.1': '深淵の', 'bp.2': '烈火の', 'bp.3': '氷結の', 'bp.4': '雷鳴の',
  'bp.5': '猛毒の', 'bp.6': '腐敗の', 'bp.7': '虚無の', 'bp.8': '黄金の', 'bp.9': '漆黒の',
  'bp.10': '灼熱の', 'bp.11': '極寒の', 'bp.12': '嵐の', 'bp.13': '幻影の', 'bp.14': '狂気の', 'bp.15': '終末の',
  'bc.goblin': 'ゴブリンロード', 'bc.demon': 'デーモン', 'bc.dragon': 'ドラゴン', 'bc.kraken': 'クラーケン',
  'bc.lich': 'リッチ', 'bc.behemoth': 'ベヒーモス', 'bc.werewolf': 'ワーウルフ', 'bc.minotaur': 'ミノタウロス',
  'bc.hydra': 'ヒュドラ', 'bc.golem': 'ゴーレム', 'bc.wyvern': 'ワイバーン', 'bc.leviathan': 'レヴィアタン',
  'bc.cerberus': 'ケルベロス', 'bc.griffin': 'グリフォン', 'bc.manticore': 'マンティコア', 'bc.ogre': 'オーガ',
  'bc.zombieking': 'ゾンビキング', 'bc.vampire': 'ヴァンパイア', 'bc.sandworm': 'サンドワーム', 'bc.megacrab': 'メガクラブ',
  'bc.kingkong': 'キングコング', 'bc.whiteshark': 'ホワイトシャーク', 'bc.tarantula': 'タランチュラ', 'bc.scorpion': 'スコーピオン',
  'bc.megalodon': 'メガロドン', 'bc.phoenix': 'フェニックス', 'bc.bat': 'バット', 'bc.satan': 'サタン',
  'bc.alien': 'エイリアン', 'bc.robot': 'ロボット',
};

// ---- 状態 ----
const KEY = 'bossraid_lang';
let cur = 'ja';
let dict = JA;
const listeners = [];

function pickDefault() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && LANGS.some((l) => l.code === q)) return q;
  const saved = localStorage.getItem(KEY);
  if (saved && LANGS.some((l) => l.code === saved)) return saved;
  const navs = navigator.languages || [navigator.language || 'en'];
  for (const n of navs) {
    const low = n.toLowerCase();
    if (low.startsWith('zh')) return /(tw|hk|hant|mo)/.test(low) ? 'zh-TW' : 'zh-CN';
    const two = low.slice(0, 2);
    const hit = LANGS.find((l) => l.code === two);
    if (hit) return hit.code;
  }
  return 'en';
}

export function currentLang() { return cur; }
export function langDir() { return (LANGS.find((l) => l.code === cur) || {}).dir || 'ltr'; }

export function t(key, params) {
  let s = dict[key] != null ? dict[key] : (JA[key] != null ? JA[key] : key);
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}

// 数値: 端末言語のロケールで整形。compact=万/億/M/B等
export function fmtNum(n) {
  n = Math.max(0, Math.floor(n));
  try { return new Intl.NumberFormat(INTL[cur] || 'en', { maximumFractionDigits: 0 }).format(n); }
  catch (_) { return String(n); }
}
export function fmtCompact(n) {
  n = Math.max(0, Math.floor(n));
  try {
    return new Intl.NumberFormat(INTL[cur] || 'en', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  } catch (_) { return fmtNum(n); }
}

export function onLangChange(fn) { listeners.push(fn); }

async function loadDict(code) {
  if (code === 'ja') return JA;
  try {
    const mod = await import(`./lang/${code}.js`);
    return Object.assign({}, JA, mod.default);
  } catch (e) {
    console.warn('[i18n] failed to load', code, e);
    return JA;
  }
}

function applyStatic() {
  const root = document.documentElement;
  root.lang = cur;
  root.dir = langDir();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const html = el.getAttribute('data-i18n-html') !== null;
    const val = t(key);
    if (html) el.innerHTML = val; else el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
}

export async function setLang(code) {
  if (!LANGS.some((l) => l.code === code)) code = 'en';
  cur = code;
  localStorage.setItem(KEY, code);
  dict = await loadDict(code);
  applyStatic();
  listeners.forEach((fn) => { try { fn(); } catch (_) {} });
}

export async function initI18n() {
  await setLang(pickDefault());
}
