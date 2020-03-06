import {assert as chaiAssert}  from 'chai';
import {vector3d, setWarningCallback} from '../src/index';

function arrayEqual(a: vector3d, b: vector3d, eps = 1e-33): void {
    assert.approximately(a[0], b[0], eps);
    assert.approximately(a[1], b[1], eps);
    assert.approximately(a[2], b[2], eps);
}

export const assert = {
    ...chaiAssert,
    arrayEqual,
}

export function disableWarnings(callback: () => void): void {
    setWarningCallback(() => {});
    callback();
    setWarningCallback((message) => console.warn(`[chemfiles] ${message}`));
}
