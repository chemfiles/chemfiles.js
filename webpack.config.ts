import path from "path";
import webpack from "webpack";
import CopyPlugin from "copy-webpack-plugin";

const defaultConfig: webpack.Configuration = {
    mode: "development",
    // Prevent webpack from messing with emscripten code loading wasm
    node: {
        __dirname: false,
        fs: 'empty',
        Buffer: false,
        process: false
    },
    entry: {
        "chemfiles": "./src/index.ts",
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    module: {
        rules: [
            { test: /\.ts?$/, loader: 'ts-loader' },
        ],
    },
    plugins: [
        new CopyPlugin([{ from: 'lib/libchemfiles.wasm', to: '' }]),
        new CopyPlugin([{ from: 'src/libchemfiles/cdecl.d.ts', to: 'src/libchemfiles/' }]),
    ],
};

const node: webpack.Configuration = {
    ...defaultConfig,
    target: "node",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "umd",
        library: "chemfiles",
    },
}

const web: webpack.Configuration = {
    ...defaultConfig,
    target: "web",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].min.js",
        libraryTarget: "umd",
        library: "chemfiles",
    },
}

module.exports = [ node, web ];
