import moment from 'moment-timezone';
import axios from 'axios';
import Takosan from 'takosan';
import Parser from 'rss-parser';
import dotenv from 'dotenv'
import { config } from './config.js'

dotenv.config()

class ChitandaSan {
  constructor() {
    this.takosan = new Takosan({
      url: process.env.TAKOSAN_URL,
      channel: process.env.TAKOSAN_CHANNEL,
      name: process.env.TAKOSAN_NAME,
      icon: process.env.TAKOSAN_ICON,
    });

    moment.tz.setDefault('Asia/Tokyo')
  }

  fetchAndNotify() {
    axios.get(config.entrypoint, {
      params: {
        start: moment().format('YYYYMMDDHHmm'),
        days: config.days,
        titlefmt: config.titlefmt,
      }
    }).then((response) => {
      this.parseRss(response.data).then((val) => {
        this.notify(val)
      })
    }).catch((error) => {
      console.log(error);
    }); 
  }

  async parseRss(content) {
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
        const start_time = moment(program[8], 'X').format('YYYY/MM/DD(dd) HH:mm');
        const end_time = moment(program[9], 'X').format('HH:mm');
        const category = categories[program[0]]
        messages.push(`・${category} ${start_time}-${end_time} ${program[4]} / *${program[5]}* `);
      }
    });

    return messages.join('\n')
  }

  notify(message) {
    this.takosan.privmsg(message);
  }
}

const c = new ChitandaSan()
c.fetchAndNotify()