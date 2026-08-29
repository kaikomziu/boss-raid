# 👹 BOSS RAID

**▶ 今すぐ遊ぶ / Play now: <https://kaikomziu.github.io/boss-raid/>**

1億HP（100,000,000）のボスを、世界中のプレイヤーと**リアルタイム協力**でクリック連打して倒すブラウザゲーム。
倒すたびに少しずつ強い（HP ×1.15）次のボスが**無限に出現**します。

登録不要・完全無料・匿名。PC / スマホ対応。ホーム画面に追加すればアプリのように起動（PWA）。

> BOSS RAID is a browser game where everyone online clicks down a single **100,000,000 HP boss together in real time**. Every hit lands on everyone's screen instantly. Beat it and a stronger boss appears — forever. Free, no sign-up, anonymous. *(UI is in Japanese.)*

## 特徴 / Features

- 🌍 **リアルタイム協力** — 接続中の全員で1体のボスを削る。他プレイヤーの攻撃が約0.2秒で反映
- ♾️ **無限に続くボス** — 倒すたびに少し強い次のボスへ
- ⚡ **弱点システム** — ときどき光る弱点を叩く（キーボードでも）とダメージ2倍
- 🏅 実績22種・称号9段階・討伐図鑑・統計
- 🎨 画面スキン24種 / 🐣 ペット育成10種＋きせかえ / ⌨ PC向けキーバインド
- 👁 `?spectate` で観戦モード

## 技術 / How it works

- 素の HTML / CSS / ES Modules（ビルド不要）、GitHub Pages 配信
- バックエンドは Supabase
  - 確定HP・ボス切り替え: `boss_raid_state` テーブル ＋ `boss_raid_hit(dmg, players)` RPC
  - 体感の速さ: Realtime **Broadcast** で各自160msごとにダメージ量を全員へ直接配信（DB非経由）
  - 表示HPは「減る一方 ＋ 確定値でズレ補正」モデルでカクつきなし
- 同時接続人数は Realtime presence（心拍方式でゴースト除外）
- プレイヤーは完全匿名。進捗は localStorage

## セットアップ / Self-hosting

Supabase の SQL Editor で [`schema.sql`](schema.sql) を実行し、[`js/config.js`](js/config.js) の接続情報を差し替えるだけ。

## ライセンス

個人制作。開発は AI（Claude）支援。AI生成のイラスト・音楽は不使用。
