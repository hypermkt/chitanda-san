import moment from 'moment';
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

let config = {
  entrypoint: 'http://cal.syoboi.jp/rss2.php'
};

axios.get(config.entrypoint, {
  params: {
    start: moment().format('YYYYMMDDHHmm'),
    days: 1,
    titlefmt: '$(Cat)##$(Flag)##$(ChGID)##$(ChName)##$(Title)##$(Count)##$(SubTitleA)##$(StTimeU)##$(EdTimeU)'
  }
}).then((response) => {
  parser.parseString(response.data, (err, feed) => {
    let messages = []
    messages.push('*わたし、今日のテレビアニメが気になります！*');
    feed.items.forEach(item => {
      let program = item.title.split('##')
      // 地域：東京、カテゴリー：アニメ
      if (program[2] == 1 && (program[0] == 1)) {
        let start_time = moment(program[7], 'X').format('YYYY/MM/DD HH:mm');
        messages.push(`> ${program[4]}  /  ${program[3]} ${start_time} 〜 `);
      }
    });

    takosan.privmsg(messages.join('\n'));
  });
}).catch((error) => {
  console.log(error);
});
