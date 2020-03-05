import {assert}  from 'chai';
import * as path from 'path';

import * as chemfiles from '../src/index';
import * as lib from '../src/libchemfiles';

describe('Miscelaneous chemfiles functions', () => {
    before((done) => {chemfiles.ready(() => done());});

    it('has a version', () => {
        assert(chemfiles.version().startsWith("0.9"));
    })

    it('has warning messages', () => {
        let MESSAGE = "";
        chemfiles.setWarningCallback((message) => MESSAGE = message);
        lib._chfl_trajectory_open(0 as lib.c_char_ptr, 0);
        assert.equal(MESSAGE, "Parameter 'path' cannot be NULL in chfl_trajectory_open");
    })

    it('can deal with warning callback throwing errors', () => {
        // save console.warn and replace it
        let MESSAGE = "";
        const consoleWarn = console.warn;
        console.warn = (message: string) => {MESSAGE = message};

        // Error thrown in warning callback are caught before making it to WASM
        chemfiles.setWarningCallback((message) => {throw Error(message)});
        lib._chfl_trajectory_open(0 as lib.c_char_ptr, 0);
        assert.equal(MESSAGE, "exception raised in warning callback: Error: Parameter 'path' cannot be NULL in chfl_trajectory_open");

        // restore console.warn
        console.warn = consoleWarn

        // disable warnings for the rest of this file
        chemfiles.setWarningCallback(() => {});
    })

    it('has a last error message', () => {
        chemfiles.clearErrors();
        assert.equal(chemfiles.lastError(), "");

        lib._chfl_trajectory_open(0 as lib.c_char_ptr, 0);
        assert.equal(chemfiles.lastError(), "Parameter 'path' cannot be NULL in chfl_trajectory_open");

        chemfiles.clearErrors();
        assert.equal(chemfiles.lastError(), "");
    })

    it('can add configuration', () => {
        const a = new chemfiles.Atom("O", "O");
        assert.equal(a.mass, 15.999);
        a.delete();

        chemfiles.addConfiguration(path.join(__dirname, 'test-config.toml'));

        const b = new chemfiles.Atom("O", "O");
        assert.equal(b.mass, 67.34);
        b.delete();
    })
});
