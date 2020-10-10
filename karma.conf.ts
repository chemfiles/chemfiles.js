import { strict as assert } from 'assert';
import * as webpackConfig from './webpack.config';

const web = (webpackConfig as any)[1];
assert(web.target === 'web');

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
        frameworks: ['mocha', 'detectBrowsers'],
        preprocessors: {
            'tests/*.ts': ['webpack'],
        },
        reporters: ['progress'],
        singleRun: true,

        proxies: {
            '/base/tests/libchemfiles.wasm': '/base/lib/libchemfiles.wasm',
        },

        webpack: {
            ...web,
            entry: undefined,
            output: undefined,
            plugins: undefined,
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
