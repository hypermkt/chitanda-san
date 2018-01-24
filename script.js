import moment from 'moment';
import axios from 'axios';
import Parser from 'rss-parser';

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
    let animes = []
    feed.items.forEach(item => {
      let program = item.title.split('##')
      // 地域：東京、カテゴリー：アニメ
      if (program[2] == 1 && (program[0] == 1)) {
        animes.push({
          channel_name: program[3],
          title: program[4],
          start_title: moment(program[7], 'X').format('YYYY/MM/DD HH:mm')
        })
      }
    });

    // TODO: Slack通知
    console.log(animes)
  });
}).catch((error) => {
  console.log(error);
});