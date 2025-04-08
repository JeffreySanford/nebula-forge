const { join, resolve } = require('path');

module.exports = {
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@app': resolve(__dirname, 'src/app'),
    },
  },
  output: {
    path: join(__dirname, '../../dist/apps/star-chart-web'),
  },
};
