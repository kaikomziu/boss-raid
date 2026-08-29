import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 現在のボス状態を取得(未セットアップなら null)
export async function fetchState() {
  const { data, error } = await supabase
    .from('boss_raid_state')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) {
    console.warn('[boss-raid] fetchState error:', error.message);
    return { error };
  }
  return { data };
}

// まとめてダメージ送信。成功すると最新状態が返る。
// players = 自分が見ている同時接続人数(ピーク記録用、任意)
// スキーマが古い(1引数版)場合は自動でフォールバックする。
let twoArg = true;
export async function sendHit(dmg, players = 0) {
  const args = twoArg ? { dmg, players } : { dmg };
  let { data, error } = await supabase.rpc('boss_raid_hit', args);
  if (error && twoArg && /function|argument|schema cache/i.test(error.message || '')) {
    twoArg = false;
    ({ data, error } = await supabase.rpc('boss_raid_hit', { dmg }));
  }
  if (error) {
    console.warn('[boss-raid] sendHit error:', error.message);
    return { error };
  }
  return { data: Array.isArray(data) ? data[0] : data };
}

// 他プレイヤーのタップ位置をリアルタイム共有(DB不要の broadcast)
export function joinTaps({ onTap } = {}) {
  const ch = supabase.channel('boss_raid_taps', {
    config: { broadcast: { self: false } },
  });
  if (onTap) ch.on('broadcast', { event: 't' }, ({ payload }) => onTap(payload));
  ch.subscribe();
  let last = 0;
  return {
    send(x, y) {
      const now = performance.now();
      if (now - last < 110) return;      // 送りすぎ防止
      last = now;
      ch.send({ type: 'broadcast', event: 't', payload: { x, y } });
    },
    destroy() { supabase.removeChannel(ch); },
  };
}

// boss_raid_state の変更を購読
export function subscribeState(onChange) {
  const ch = supabase
    .channel('boss_raid_state_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'boss_raid_state' },
      (payload) => onChange(payload.new)
    )
    .subscribe();
  return ch;
}

// 同時接続人数(presence)
// Supabase の presence は切断が汚いと「幽霊」が数十秒〜数分残るので、
// 各自 20 秒ごとに track で心拍を打ち、心拍が古い key は数えない。
export function joinPresence(onCount) {
  const id = Math.random().toString(36).slice(2);
  const STALE = 40000;
  const ch = supabase.channel('boss_raid_presence', {
    config: { presence: { key: id } },
  });

  function recount() {
    const st = ch.presenceState();
    const now = Date.now();
    let live = 0;
    for (const metas of Object.values(st)) {
      const newest = Math.max(0, ...metas.map((m) => m.at || 0));
      if (now - newest < STALE) live++;
    }
    onCount(Math.max(1, live));
  }

  const beat = () => ch.track({ at: Date.now() }).then(recount).catch(() => {});

  ch.on('presence', { event: 'sync' }, recount);
  ch.subscribe((status) => { if (status === 'SUBSCRIBED') beat(); });

  const hb = setInterval(beat, 15000);
  const sweep = setInterval(recount, 5000);
  addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
  const bye = () => {
    clearInterval(hb);
    clearInterval(sweep);
    try { ch.untrack(); } catch (_) {}
  };
  addEventListener('pagehide', bye);
  addEventListener('beforeunload', bye);

  return ch;
}
