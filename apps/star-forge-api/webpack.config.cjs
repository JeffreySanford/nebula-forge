const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const nodeExternals = require('webpack-node-externals');
const { join, resolve } = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  target: 'node',
  mode: 'production',
  externals: [nodeExternals()],
  entry: {
    main: './src/main.ts'
  },
  output: {
    path: join(__dirname, '../../dist/apps/star-forge-api'),
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    plugins: [
      // Use the tsconfig in the app directory
      new TsconfigPathsPlugin({ configFile: join(__dirname, 'tsconfig.json') })
    ],
    modules: ['node_modules', resolve(__dirname, 'src')],
    alias: {
      '@app': resolve(__dirname, 'src/app'),
      '@dto': resolve(__dirname, 'src/app/dto'),
      '@interfaces': resolve(__dirname, 'src/app/interfaces'),
      '@schemas': resolve(__dirname, 'src/app/schemas'),
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: join(__dirname, 'tsconfig.json'), // Use absolute path
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: join(__dirname, 'tsconfig.json'), // Use absolute path
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    })
  ]
};
