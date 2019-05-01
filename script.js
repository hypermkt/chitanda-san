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
}).then((response) => {
  moment.locale('ja') // 日本語の曜日を出力するため
  let categories = {1: ':tv:', 8: ':movie_camera:'}
  parser.parseString(response.data, (err, feed) => {
    let messages = []
    messages.push('*わたし、今日のテレビアニメが気になります！*');
    messages.push('');
    feed.items.forEach(item => {
      let program = item.title.split('##')
      if ((program[0] == 1 || program[0] == 8) && // カテゴリー: アニメ・映画
          program[2] == 1     // 地域: 東京
        ) {
        let start_time = moment(program[8], 'X').tz('Asia/Tokyo').format('YYYY/MM/DD(dd) HH:mm');
        let end_time = moment(program[9], 'X').tz('Asia/Tokyo').format('HH:mm');
        let category = categories[program[0]]
        messages.push(`・${category} ${start_time}-${end_time} ${program[4]} / *${program[5]}* `);
      }
    });

    takosan.privmsg(messages.join('\n'));
  });
}).catch((error) => {
  console.log(error);
});
