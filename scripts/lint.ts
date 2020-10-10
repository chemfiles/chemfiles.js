/* eslint-disable @typescript-eslint/prefer-regexp-exec */

import fs from 'fs';
import path from 'path';
import glob from 'glob';

let ERRORS = 0;
function error(message: string) {
    ERRORS += 1;
    // eslint-disable-next-line no-console
    console.error('error:', message);
}

const SRC_ROOT = path.join(__dirname, '..', 'src');

/// Get all functions defined in chemfiles C API
function capiFunctions(options?: { only_chfl_status: boolean }): Set<string> {
    const file = path.join(SRC_ROOT, 'libchemfiles', 'index.d.ts');
    const content = fs.readFileSync(file, { encoding: 'utf8' });

    const functions = new Set<string>();
    for (const line of content.split('\n')) {
        if (line.startsWith('export declare function')) {
            const name = line.split(' ')[3].split('(')[0];
            const rettype = line.split('): ')[1].split(';')[0];
            if (name.startsWith('_chfl_')) {
                if (options && options.only_chfl_status && rettype !== 'chfl_status') {
                    continue;
                }
                functions.add(name);
            }
        }
    }
    return functions;
}

/// Get all functions used in the bindings
function usedFunctions(): Set<string> {
    const functions = new Set<string>();
    const files = glob.sync(path.join(SRC_ROOT, '**/*.ts'));
    for (const file of files) {
        if (file.includes('libchemfiles')) {
            continue;
        }
        const content = fs.readFileSync(file, { encoding: 'utf8' });

        for (const line of content.split('\n')) {
            const match = line.match(/_chfl_\w*/);
            if (match) {
                functions.add(match[0]);
            }
        }
    }

    return functions;
}

/// Check that all C API functions are used in the bindings
function allFunctionAreUsed() {
    const all = capiFunctions();
    const used = usedFunctions();
    for (const fn of all.values()) {
        if (!used.has(fn)) {
            error(`function ${fn} is not used`);
        }
    }
}

/// Check that the return code of C API function is checked
function statusIsChecked() {
    const all = capiFunctions({ only_chfl_status: true });

    const files = glob.sync(path.join(SRC_ROOT, '**/*.ts'));
    for (const file of files) {
        if (file.includes('libchemfiles')) {
            continue;
        }

        const lines = fs.readFileSync(file, { encoding: 'utf8' }).split('\n');
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/_chfl_\w*/);
            if (match && all.has(match[0])) {
                if (match[0] === '_chfl_residue_id') {
                    // we need to manually check the status to differenciate
                    // between error and no residue id.
                    continue;
                }

                let check = lines[i];
                if (check.match(/^\s*[\w\d]+\._chfl_\w*\(/)) {
                    // the line starts with the function call, check the
                    // previous line
                    check = lines[i - 1] + check;
                }

                if (!check.match(/check\(\s*[\w\d]+\._chfl_\w*\(/)) {
                    error(`missing status check in ${file}:${i + 1}`);
                }
            }
        }
    }
}

// ============== start of main script

allFunctionAreUsed();
statusIsChecked();

if (ERRORS !== 0) {
    throw Error(`Linting failed with ${ERRORS} errors`);
}
