import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as vm from 'vm';

import {assert} from './utils';

import * as chemfiles from '../src/';

// run dynamically generated doctest files
describe('Doctests', () => {
    before((done) => { chemfiles.ready(() => done()); });

    chemfiles.setWarningCallback(() => {});
    const context = vm.createContext({
        assert: assert,
        chemfiles: chemfiles,
        test: it,
    });

    for (const file of glob.sync(path.join(__dirname, 'doc', '**/*.ts'))) {
        const basename = path.basename(file);
        const options = {
            filename: basename.split('.').slice(0, 2).join('.'),
            // -4 since that the number of lines added before the actual test
            lineOffset: parseInt(basename.split('-')[1].split('.')[0], 10) - 4,
        };

        const code = fs.readFileSync(file, {encoding: 'utf8'});
        vm.runInContext(code, context, options);
    }
});
