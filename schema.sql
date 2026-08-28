-- ============================================================
--  BOSS RAID  —  Supabase スキーマ
--  共有プロジェクト kifnzvktwbomxthzvvgy の SQL Editor で実行する
-- ============================================================

create table if not exists boss_raid_state (
  id             int primary key default 1 check (id = 1),
  boss_index     int    not null default 0,
  boss_name      text   not null default 'スライム大王',
  boss_emoji     text   not null default '🟢',
  max_hp         bigint not null default 100000000,
  hp             bigint not null default 100000000,
  defeated_count bigint not null default 0,
  updated_at     timestamptz not null default now()
);

insert into boss_raid_state (id) values (1) on conflict do nothing;

alter table boss_raid_state enable row level security;

drop policy if exists "boss_raid read" on boss_raid_state;
create policy "boss_raid read" on boss_raid_state for select using (true);

-- まとめて受け取ったダメージを原子的に適用し、0以下なら次のボスへロールする
create or replace function boss_raid_hit(dmg bigint)
returns boss_raid_state
language plpgsql
security definer
set search_path = public
as $$
declare
  st  boss_raid_state;
  d   bigint := greatest(0, dmg);            -- 負値だけ弾く(ダメージ上限は無し)
  n   int;
  nhp bigint;
begin
  update boss_raid_state
     set hp = hp - d,
         updated_at = now()
   where id = 1
  returning * into st;

  if st.hp <= 0 then
    n := st.boss_index + 1;
    -- 1.15^n。bigint オーバーフロー回避のため指数は 150 で頭打ち
    nhp := floor(100000000 * power(1.15, least(n, 150)))::bigint;
    update boss_raid_state
       set boss_index     = n,
           defeated_count  = defeated_count + 1,
           max_hp          = nhp,
           hp              = nhp,
           boss_name       = 'BOSS #' || (n + 1),
           updated_at      = now()
     where id = 1
    returning * into st;
  end if;

  return st;
end
$$;

grant execute on function boss_raid_hit(bigint) to anon;

-- リアルタイム配信に登録(これを忘れると postgres_changes が無音になる)
alter publication supabase_realtime add table boss_raid_state;
