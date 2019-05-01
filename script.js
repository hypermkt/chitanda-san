import moment from 'moment-timezone';
import axios from 'axios';
import Takosan from 'takosan';
import Parser from 'rss-parser';
import { IncomingWebhook } from '@slack/client';
import dotenv from 'dotenv'

dotenv.config()

let takosan = new Takosan({
  url: process.env.TAKOSAN_URL,
  channel: process.env.TAKOSAN_CHANNEL,
  name: process.env.TAKOSAN_NAME,
  icon: process.env.TAKOSAN_ICON,
});

let parser = new Parser();

// refs: https://sites.google.com/site/syobocal/spec/rss2-php
let config = {
  entrypoint: 'http://cal.syoboi.jp/rss2.php'
};

axios.get(config.entrypoint, {
  params: {
    start: moment().tz('Asia/Tokyo').format('YYYYMMDDHHmm'),
    // 1日分取得する
    days: 1,

    /*
      0: カテゴリ値
      1: フラグ値
      2: チャンネルグループID
      3: チャンネル名
      4: 完全なタイトル
      5: 回数 = 話数
      6: サブタイトル
      7: 開始時間 (Unix Epoch)
      8: 終了時間 (Unix Epoch)
    */
    titlefmt: '$(Cat)##$(Flag)##$(ChGID)##$(ChName)##$(Title)##$(Count)##$(SubTitleA)##$(StTimeU)##$(EdTimeU)'
  }
}).then((response) => {
  parser.parseString(response.data, (err, feed) => {
    let messages = []
    messages.push('*わたし、今日のテレビアニメが気になります！*');
    feed.items.forEach(item => {
      let program = item.title.split('##')
      if (program[0] == 1 &&  // カテゴリー: アニメ
          program[2] == 1     // 地域: 東京
        ) {
        let start_time = moment(program[7], 'X').tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
        messages.push(`> ${program[4]}  /  ${program[3]} ${start_time} 〜 `);
      }
    });

    takosan.privmsg(messages.join('\n'));
  });
}).catch((error) => {
  console.log(error);
});
