import {strict as assert} from 'assert';
import * as webpackConfig from './webpack.config';

const web = (webpackConfig as any)[1];
assert(web.target === 'web');

module.exports = (config: any) => {
    config.set({
        autoWatch: false,
        concurrency: 1,
        exclude: ['tests/doc.ts'],
        files: [
            {pattern: 'lib/libchemfiles.wasm', included: false, served: true, type: 'wasm'},
            {pattern: 'tests/data/*', included: false, served: true},
            'tests/*.ts',
        ],
        frameworks: [
            'mocha',
            'detectBrowsers',
        ],
        mime: {
            'application/wasm': ['wasm'],
        },
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
        },
    });
};
