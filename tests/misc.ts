import {assert}  from 'chai';

import * as chemfiles from '../src/index';
import * as lib from '../src/libchemfiles';

describe('Miscelaneous chemfiles functions', () => {
    before((done) => {chemfiles.ready(() => done());});

    it('has a version', () => {
        assert(chemfiles.version().startsWith("0.9"));
    })

    it('has an error message', () => {
        chemfiles.clearErrors();
        assert.equal(chemfiles.lastError(), "");

        lib._chfl_trajectory_open(0 as lib.c_char_ptr, 0);
        assert.equal(chemfiles.lastError(), "Parameter 'path' cannot be NULL in chfl_trajectory_open");

        chemfiles.clearErrors();
        assert.equal(chemfiles.lastError(), "");
    })
});
