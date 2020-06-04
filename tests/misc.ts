import * as path from 'path';

import * as chemfiles from '../src';
import {assert} from './utils';

import {DATADIR} from './data';

describe('Miscelaneous chemfiles functions', () => {
    before((done) => {chemfiles.ready(() => done()); });

    it('has a version', () => {
        assert.isTrue(chemfiles.version().startsWith('0.9'));
    });

    it('has warning messages', () => {
        let MESSAGE = '';
        chemfiles.setWarningCallback((message) => MESSAGE = message);
        try {
            new chemfiles.Trajectory('not-here');
        } catch {
            /* do nothing */
        }
        assert.equal(MESSAGE, 'file at \'not-here\' does not have an extension, provide a format name to read it');
    });

    it('can deal with warning callback throwing errors', () => {
        // save console.warn and replace it
        let MESSAGE = '';
        // eslint-disable-next-line no-console
        const consoleWarn = console.warn;
        /* eslint-disable */
        console.warn = (...args: any[]) => {MESSAGE = args.map((a) => a.toString()).join(" ");};
        /* eslint-enable */

        // Error thrown in warning callback are caught before making it to WASM
        chemfiles.setWarningCallback((message) => {throw Error(message); });
        try {
            new chemfiles.Trajectory('not-here');
        } catch {
            /* do nothing */
        }
        assert.equal(MESSAGE, 'exception raised in warning callback: Error: file at \'not-here\' does not have an extension, provide a format name to read it');

        // restore console.warn
        // eslint-disable-next-line no-console
        console.warn = consoleWarn;

        // disable warnings for the rest of this file
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        chemfiles.setWarningCallback(() => {});
    });

    it('has a last error message', () => {
        chemfiles.clearErrors();
        assert.equal(chemfiles.lastError(), '');

        try {
            new chemfiles.Trajectory('not-here');
        } catch {
            /* do nothing */
        }
        assert.equal(chemfiles.lastError(), 'file at \'not-here\' does not have an extension, provide a format name to read it');

        chemfiles.clearErrors();
        assert.equal(chemfiles.lastError(), '');
    });

    it('can add configuration', () => {
        const a = new chemfiles.Atom('O', 'O');
        assert.equal(a.mass, 15.999);
        a.delete();

        chemfiles.addConfiguration(path.join(DATADIR, 'test-config.toml'));

        const b = new chemfiles.Atom('O', 'O');
        assert.equal(b.mass, 67.34);
        b.delete();
    });
});
