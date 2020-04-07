import {assert as chaiAssert} from 'chai';
import {setWarningCallback} from '../src/';

function arrayEqual(a: any, b: any, eps = 1e-33): void {
    assert.equal(a.length, 3, 'length must be 3 for a');
    assert.equal(b.length, 3, 'length must be 3 for b');
    assert.approximately(a[0], b[0], eps);
    assert.approximately(a[1], b[1], eps);
    assert.approximately(a[2], b[2], eps);
}

function throwWith(cb: () => void, message: string): void {
    try {
        cb();
    } catch (error) {
        assert.equal(error.message, message);
        return;
    }
    assert.fail('no error thrown when one was expected');
}

export const assert = {
    ...chaiAssert,
    arrayEqual,
    throwWith,
};

export function disableWarnings(callback: () => void): void {
    setWarningCallback(() => {});
    callback();
    // tslint:disable-next-line:no-console
    setWarningCallback((message) => console.warn(`[chemfiles] ${message}`));
}
