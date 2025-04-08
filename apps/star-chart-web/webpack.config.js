import { join, resolve } from 'path';

export default {
  target: 'node',
  mode: 'production',
  externals: [nodeExternals()],
  entry: {
    main: './src/main.ts'
  },
  output: {
    path: join(process.cwd(), '../../dist/apps/star-forge-api'),
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'], // Ensure .ts is included
    alias: {
      '@app': resolve(__dirname, 'src/app'),
      '@dto': resolve(__dirname, 'src/app/dto'),
      '@interfaces': resolve(__dirname, 'src/app/interfaces'),
      '@schemas': resolve(__dirname, 'src/app/schemas'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    })
  ]
};