import moment from 'moment';
import axios from 'axios';
import Parser from 'rss-parser';
import { IncomingWebhook } from '@slack/client';
import dotenv from 'dotenv'

dotenv.config()

const webhook = new IncomingWebhook(process.env.INCOMING_WEBHOOK_URL, {
  username: process.env.INCOMING_WEBHOOK_USERNAME,
  iconEmoji: process.env.INCOMING_WEBHOOK_ICONEMOJI,
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
    messages.push('*わたし、気になります！*');
    feed.items.forEach(item => {
      let program = item.title.split('##')
      // 地域：東京、カテゴリー：アニメ
      if (program[2] == 1 && (program[0] == 1)) {
        let start_time = moment(program[7], 'X').format('YYYY/MM/DD HH:mm');
        messages.push(`> ${program[4]}  /  ${program[3]} ${start_time} 〜 `);
      }
    });

    webhook.send(messages.join('\n'), function(err, res) {
      if (err) {
          console.log('Error:', err);
      } else {
          console.log('Message sent: ', res);
      }
    });
  });
}).catch((error) => {
  console.log(error);
});