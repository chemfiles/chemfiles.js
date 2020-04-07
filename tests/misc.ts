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
        // tslint:disable-next-line:no-unused-expression
        try {new chemfiles.Trajectory('not-here'); } catch {}
        assert.equal(MESSAGE, 'file at \'not-here\' does not have an extension, provide a format name to read it');
    });

    it('can deal with warning callback throwing errors', () => {
        // save console.warn and replace it
        let MESSAGE = '';
        const consoleWarn = console.warn;  // tslint:disable-line:no-console
        // tslint:disable-next-line:no-console
        console.warn = (message: string) => {MESSAGE = message; };

        // Error thrown in warning callback are caught before making it to WASM
        chemfiles.setWarningCallback((message) => {throw Error(message); });
        // tslint:disable-next-line:no-unused-expression
        try {new chemfiles.Trajectory('not-here'); } catch {}
        assert.equal(MESSAGE, 'exception raised in warning callback: Error: file at \'not-here\' does not have an extension, provide a format name to read it');

        // restore console.warn
        console.warn = consoleWarn;  // tslint:disable-line:no-console

        // disable warnings for the rest of this file
        chemfiles.setWarningCallback(() => {});
    });

    it('has a last error message', () => {
        chemfiles.clearErrors();
        assert.equal(chemfiles.lastError(), '');

        // tslint:disable-next-line:no-unused-expression
        try {new chemfiles.Trajectory('not-here'); } catch {}
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
