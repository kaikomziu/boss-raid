# BOSS RAID

1億HPのボスを、世界中のプレイヤーとリアルタイム協力で連打して倒すゲーム。
倒すたびに少しずつ強い(HP ×1.15)次のボスが無限に出現します。

公開: https://kaikomziu.github.io/boss-raid/

## 仕組み

- 素の HTML / CSS / ES Modules(ビルド不要)。GitHub Pages 配信。
- バックエンドは共有 Supabase(`kifnzvktwbomxthzvvgy`)。
  - `boss_raid_state` … 現在のボス状態(1行)
  - `boss_raid_hit(dmg)` RPC … まとめて受け取ったダメージを原子的に適用、0以下で次のボスへロール
- クライアントは約 0.7 秒ぶんのクリックをまとめて RPC 送信。
- 全員が `boss_raid_state` を `postgres_changes` で購読し、誰かが殴ると全画面に即反映。
- 同時接続人数は Realtime presence。
- プレイヤーは完全匿名。累計クリック数と現ボスへのダメージは localStorage に記録。
- チート対策なし(ダメージ上限なし、負値のみ拒否)。

## セットアップ

Supabase の SQL Editor で [`schema.sql`](schema.sql) を実行するだけ。
実行前はゲーム画面に「設定待ち」バナーが出て、ローカル表示のみになります。

## ファイル

| ファイル | 役割 |
|---|---|
| `js/config.js` | Supabase 接続情報・各種定数 |
| `js/bosses.js` | `boss_index` からボスの名前/絵文字/色/HP を決定論的に生成 |
| `js/net.js` | Supabase クライアント・RPC・購読・presence |
| `js/fx.js` | 効果音 / 花火 / ダメージポップ / 画面揺れ |
| `js/main.js` | ゲーム本体 |
| `js/version.js` | 更新履歴 |
