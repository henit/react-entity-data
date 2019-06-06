const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
        include: path.resolve(__dirname, '../')
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
        include: path.resolve(__dirname, '../')
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg|jpg|png|gif|ico)(\?(.*))?$/,
        use: ['file-loader?name=[path][name].[hash].[ext]']
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          babelrc: true,
          extends: path.join(__dirname, '..', '.babelrc'),
          cacheDirectory: true
        }
      }
    ]
  },
  resolve: {
    alias: {
      'entity-state': path.resolve('../entity-state')
    }
  }
};
