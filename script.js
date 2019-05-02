import moment from 'moment-timezone';
import axios from 'axios';
import Takosan from 'takosan';
import Parser from 'rss-parser';
import { IncomingWebhook } from '@slack/client';
import dotenv from 'dotenv'

dotenv.config()

const takosan = new Takosan({
  url: process.env.TAKOSAN_URL,
  channel: process.env.TAKOSAN_CHANNEL,
  name: process.env.TAKOSAN_NAME,
  icon: process.env.TAKOSAN_ICON,
});

// refs: https://sites.google.com/site/syobocal/spec/rss2-php
const config = {
  entrypoint: 'http://cal.syoboi.jp/rss2.php',
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
};

axios.get(config.entrypoint, {
  params: config.params
}).then((response) => {
  parseRss(response.data).then((val) => {
    notify(val)
  })
}).catch((error) => {
  console.log(error);
});

async function parseRss(content) {
  moment.locale('ja') // 日本語の曜日を出力するため
  const parser = new Parser();
  const feed = await parser.parseString(content)
  const categories = {1: '[TV]', 8: '[映]'}
  let messages = []
  messages.push('*わたし、今日のテレビアニメが気になります！*');
  messages.push('');
  feed.items.forEach(item => {
    const program = item.title.split('##')
    if ((program[0] == 1 || program[0] == 8) && // カテゴリー: アニメ・映画
        program[2] == 1     // 地域: 東京
      ) {
      const start_time = moment(program[8], 'X').tz('Asia/Tokyo').format('YYYY/MM/DD(dd) HH:mm');
      const end_time = moment(program[9], 'X').tz('Asia/Tokyo').format('HH:mm');
      const category = categories[program[0]]
      messages.push(`・${category} ${start_time}-${end_time} ${program[4]} / *${program[5]}* `);
    }
  });

  return messages.join('\n')
}

const notify = (message) => {
    takosan.privmsg(message);
}
