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

// まとめてダメージ送信。成功すると最新状態が返る
export async function sendHit(dmg) {
  const { data, error } = await supabase.rpc('boss_raid_hit', { dmg });
  if (error) {
    console.warn('[boss-raid] sendHit error:', error.message);
    return { error };
  }
  // rpc が setof/row を返すと配列になることがある
  return { data: Array.isArray(data) ? data[0] : data };
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
export function joinPresence(onCount) {
  const id = Math.random().toString(36).slice(2);
  const ch = supabase.channel('boss_raid_presence', {
    config: { presence: { key: id } },
  });
  ch.on('presence', { event: 'sync' }, () => {
    onCount(Object.keys(ch.presenceState()).length);
  });
  ch.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') await ch.track({ at: Date.now() });
  });
  return ch;
}
