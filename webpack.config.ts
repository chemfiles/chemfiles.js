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
            { test: /\.ts?$/, loader: 'ts-loader', options: { configFile: 'tsconfig-build.json' } },
        ],
    },

    plugins: [
        new CopyPlugin({
            // copy src/libchemfiles/index.d.ts to dist/src/libchemfiles/index.d.ts
            // so that dts-bundle-generator can find it
            patterns: [{ from: 'src/libchemfiles/index.d.ts', to: 'src/libchemfiles/' }],
        }),
    ],

    resolve: {
        extensions: ['.js', '.ts'],
        fallback: {
            assert: false,
            crypto: false,
            fs: false,
            os: false,
            path: false,
            util: false,
            vm: false,
        },
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

module.exports = [node, web];
