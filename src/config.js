// refs: https://sites.google.com/site/syobocal/spec/rss2-php
module.exports = {
  config: {
    entrypoint: 'http://cal.syoboi.jp/rss2.php',
    // 1日分取得する
    days: 1,

    /*
      0: カテゴリ値
      1: フラグ値
      2: チャンネルグループID
      3: チャンネルID
      4: チャンネル名
      5: 完全なタイトル
      6: 回数 = 話数
      7: サブタイトル
      8: 開始時間 (Unix Epoch)
      9: 終了時間 (Unix Epoch)
    */
    titlefmt: '$(Cat)##$(Flag)##$(ChGID)##$(ChID)##$(ChName)##$(Title)##$(Count)##$(SubTitleA)##$(StTimeU)##$(EdTimeU)'
  }
};