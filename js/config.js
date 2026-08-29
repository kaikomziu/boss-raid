// ------------------------------------------------------------------
//  Supabase 設定(共有プロジェクト kifnzvktwbomxthzvvgy)
//  boss_raid_state テーブル / boss_raid_hit(dmg) RPC を使用
// ------------------------------------------------------------------
export const SUPABASE_URL = 'https://kifnzvktwbomxthzvvgy.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE';

// DBへ確定ダメージを送る間隔(ms)。体感の速さは broadcast が担うので短めでOK。
export const FLUSH_INTERVAL = 450;
// broadcast でダメージ量を配る間隔(ms)。これが「他人の攻撃が見えるまで」の速さ。
export const LIVE_INTERVAL = 160;

// 基準HP(ボス1体目)。以降 BASE_HP * 1.15^index
export const BASE_HP = 100_000_000;
export const HP_GROWTH = 1.15;
