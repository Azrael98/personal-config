const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'config-renderer.js',
    library: 'config-renderer',
    libraryTarget: 'umd',
  },
  mode: 'development',
  module: {
    rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react'],
            },
          },
        },
      ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
