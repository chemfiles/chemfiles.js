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
        it: it,
    });

    for (const filename of glob.sync(path.join(__dirname, '..', 'src', '**/*.ts'))) {
        if (filename.endsWith('.d.ts')) {
            continue;
        }

        const content = fs.readFileSync(filename, { encoding: 'utf8' });
        const lines = content.split('\n');

        const code = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            let start;
            let end;
            if (line.includes('typescript doctest')) {
                const prefix = line.search('```');
                start = i + 1;

                while (i < lines.length) {
                    i++;
                    const line = lines[i];
                    if (line.includes('```')) {
                        end = i;
                        break;
                    }
                }

                if (end === undefined) {
                    throw Error('Missing closing ``` in doctest');
                }

                const example = [];
                example.push(`it('${path.basename(filename)} (line ${start})', () => {`);
                for (let j = start; j < end; j++) {
                    example.push(lines[j].substring(prefix));
                }
                example.push('});');

                code.push(example.join('\n'));
            }
        }

        for (const snippet of code) {
            vm.runInContext(snippet, context);
        }
    }
});
