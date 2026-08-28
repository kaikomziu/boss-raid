// BOSS RAID - 更新履歴
export const VERSION_HISTORY = [
  {
    version: '1.0.0',
    date: '2026-08-28',
    notes: '公開。1億HPのボスをみんなでリアルタイム協力連打。撃破で少し強い次のボスが無限に出現。同時接続人数表示・ダメージポップ・画面揺れ・撃破ファンファーレ+花火・ポコポコ音・貢献度記録。',
  },
  {
    version: '1.0.1',
    date: '2026-08-28',
    notes: '同時接続人数が実際より多く表示される問題を修正(切断時に残るpresenceの幽霊を、心拍が古いものは数えないようにして除外)。タブを閉じた時のuntrack処理も追加。',
  },
  {
    version: '1.1.0',
    date: '2026-08-28',
    notes: '画面スキンを23種類追加(🎨スキンボタンから変更、選択はlocalStorageに保存)。スペース/エンターキーを長押しした時にキーリピートで連打扱いになっていたのを修正(1回押し=1ダメージ)。',
  },
];
export const CURRENT_VERSION = VERSION_HISTORY[VERSION_HISTORY.length - 1].version;
