import fs from 'fs';
import glob from 'glob';
import path from 'path';
import vm from 'vm';

import { assert } from './utils';

import * as chemfiles from 'chemfiles';

// run dynamically generated doctest files
describe('Doctests', () => {
    before((done) => {
        chemfiles.ready(() => done());
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
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

        const code = fs.readFileSync(file, { encoding: 'utf8' });
        vm.runInContext(code, context, options);
    }
});
