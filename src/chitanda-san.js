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
    moment.locale('ja') // 日本語の曜日を出力するため
  }

  fetchAndNotify() {
    axios.get(config.entrypoint, {
      params: {
        start: moment().format('YYYYMMDD1300'),
        end: moment().add(1, 'days').format('YYYYMMDD0300'),
        days: config.days,
        titlefmt: config.titlefmt,
      }
    }).then((response) => {
      this.parseRss(response.data).then((feeds) => {
        this.notify(this.createMessages(feeds))
      })
    }).catch((error) => {
      console.log(error);
    }); 
  }

  async parseRss(content) {
    const parser = new Parser();
    const feeds = await parser.parseString(content)
    return feeds.items.map(item => {
      const program = item.title.split('##')
      return {
        Cat: program[0],
        Flag: program[1],
        ChGID: program[2],
        ChID: program[3],
        ChName: program[4],
        Title: program[5],
        Count: program[6],
        SubTitleA: program[7],
        StTimeU: program[8],
        EdTimeU: program[9],
      }
    }).filter(item => {
      return (item.Cat == 1 || item.Cat == 8) && item.ChGID == 1 // カテゴリー: アニメ・映画, 地域: 東京
    })
  }

  createMessages(items) {
    const categories = {1: '[TV]', 8: '[映]'}
    const messages = items.map(item => {
        const start_time = moment(item.StTimeU, 'X').format('MM/DD(dd) HH:mm');
        const end_time = moment(item.EdTimeU, 'X').format('HH:mm');
        const category = categories[item.Cat]
        return `・${category} ${start_time}-${end_time} ${item.ChName} / *${item.Title}* `
    })

    return ['*わたし、今日のテレビアニメが気になります！*', ''].concat(messages).join('\n')
  }

  notify(message) {
    this.takosan.privmsg(message);
  }
}

const c = new ChitandaSan()
c.fetchAndNotify()