import { assert as chaiAssert } from 'chai';
import { Vector3d, setWarningCallback } from 'chemfiles';

function arrayEqual(a: Vector3d, b: Vector3d, eps = 1e-33): void {
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
        // eslint-disable-next-line no-extra-parens
        assert.equal((error as Error).message, message);
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setWarningCallback(() => {});
    callback();
    // eslint-disable-next-line no-console
    setWarningCallback((message) => console.warn(`[chemfiles] ${message}`));
}
