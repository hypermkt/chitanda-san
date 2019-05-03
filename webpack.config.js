module.exports = {
  mode: 'production',
  target: 'node',
  entry: './src/chitanda-san.js', 
  output: {
    path: __dirname + '/dist',
    filename: 'chitanda-san.js'
  }
};