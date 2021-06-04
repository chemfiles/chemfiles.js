import { strict as assert } from 'assert';
import path from 'path';
import webpack from 'webpack';

import * as webpackConfig from './webpack.config';

const webpackWebConfig = (webpackConfig as any)[1];
assert(webpackWebConfig.target === 'web');

webpackWebConfig.output.filename = undefined;
webpackWebConfig.resolve.alias = {
    chemfiles: path.resolve(__dirname, 'dist/chemfiles.min.js'),
};

// allow tests to access path
webpackWebConfig.resolve.fallback.path = require.resolve('path-browserify');

module.exports = (config: any) => {
    config.set({
        autoWatch: false,
        browserNoActivityTimeout: 10000,
        concurrency: 1,
        client: {
            mocha: {
                timeout: 8000,
            },
        },
        exclude: ['tests/doc.ts'],
        files: [{ pattern: 'tests/data/*', included: false, served: true }, 'tests/*.ts'],
        frameworks: ['webpack', 'mocha', 'detectBrowsers'],
        preprocessors: {
            'tests/*.ts': ['webpack'],
        },
        reporters: ['progress'],
        singleRun: true,

        proxies: {
            '/base/tests/libchemfiles.wasm': '/base/lib/libchemfiles.wasm',
        },

        webpack: {
            ...webpackWebConfig,
            entry: undefined,
        },
        webpackMiddleware: {
            stats: 'errors-only',
        },

        detectBrowsers: {
            preferHeadless: true,
            usePhantomJS: false,
            postDetection: (list: string[]) => {
                const chrome = list.indexOf('ChromeHeadless');
                if (chrome !== -1) {
                    list[chrome] = 'ChromeHeadlessNoSandbox';
                }
                return list;
            },
        },

        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox'],
            },
        },
    });
};
