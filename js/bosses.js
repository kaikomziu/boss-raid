// ボスは boss_index から決定論的に生成する(DBは index だけ持てばよい)
// 名前は i18n から組み立てる(言語ごとに表示が変わる)
import { BASE_HP, HP_GROWTH } from './config.js';
import { t } from './i18n.js';

// 生き物ID と絵文字(絵文字は言語共通)
const CREATURES = [
  ['goblin', '👺'], ['demon', '👿'], ['dragon', '🐉'], ['kraken', '🦑'],
  ['lich', '💀'], ['behemoth', '🦣'], ['werewolf', '🐺'], ['minotaur', '🐗'],
  ['hydra', '🐍'], ['golem', '🗿'], ['wyvern', '🦖'], ['leviathan', '🐋'],
  ['cerberus', '🐕'], ['griffin', '🦅'], ['manticore', '🦁'], ['ogre', '👹'],
  ['zombieking', '🧟'], ['vampire', '🧛'], ['sandworm', '🪱'], ['megacrab', '🦀'],
  ['kingkong', '🦍'], ['whiteshark', '🦈'], ['tarantula', '🕷️'], ['scorpion', '🦂'],
  ['megalodon', '🦕'], ['phoenix', '🦤'], ['bat', '🦇'], ['satan', '😈'],
  ['alien', '👽'], ['robot', '🤖'],
];
const PREFIX_COUNT = 16;
const HUES = [0, 22, 42, 130, 158, 195, 218, 262, 288, 322];

function h(n) {
  let x = (n + 1) * 2654435761;
  x = (x ^ (x >>> 15)) * 2246822519;
  x = (x ^ (x >>> 13)) * 3266489917;
  return (x ^ (x >>> 16)) >>> 0;
}

export function bossFor(index) {
  if (index === 0) {
    return { index: 0, emoji: '🟢', slime: true, hue: 135, maxHp: BASE_HP };
  }
  const [creatureId, emoji] = CREATURES[h(index) % CREATURES.length];
  const prefixIdx = h(index * 7 + 2) % PREFIX_COUNT;
  const hue = HUES[h(index * 3 + 1) % HUES.length];
  const maxHp = Math.floor(BASE_HP * Math.pow(HP_GROWTH, index));
  return { index, emoji, creatureId, prefixIdx, hue, maxHp };
}

// 現在の言語でボス名を組み立てる
export function bossName(boss) {
  if (boss.slime) return t('boss.slime');
  return t('boss.format', {
    prefix: t('bp.' + boss.prefixIdx),
    creature: t('bc.' + boss.creatureId),
  });
}
