import path from 'path';
import webpack from 'webpack';

import CopyPlugin from 'copy-webpack-plugin';

const defaultConfig: webpack.Configuration = {
    entry: {
        chemfiles: './src/index.ts',
    },
    mode: 'development',
    module: {
        rules: [
            {  test: /\.ts?$/, loader: 'ts-loader' },
        ],
    },
    // Prevent webpack from messing with emscripten code loading wasm
    node: {
        Buffer: false,
        __dirname: false,
        fs: 'empty',
        process: false,
    },
    plugins: [
        new CopyPlugin({patterns: [
            { from: 'lib/libchemfiles.wasm', to: ''},
            { from: 'src/libchemfiles/cdecl.d.ts', to: 'src/libchemfiles/' },
        ]}),
    ],

    resolve: {
        extensions: ['.js', '.ts'],
    },
};

const node: webpack.Configuration = {
    ...defaultConfig,
    output: {
        filename: '[name].js',
        library: 'chemfiles',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'node',
};

const web: webpack.Configuration = {
    ...defaultConfig,
    output: {
        filename: '[name].min.js',
        library: 'chemfiles',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'web',
};

module.exports = [ node, web ];
