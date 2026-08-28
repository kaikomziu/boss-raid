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
];
export const CURRENT_VERSION = VERSION_HISTORY[VERSION_HISTORY.length - 1].version;
