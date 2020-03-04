import {assert}  from 'chai';
import {vector3d} from '../src/index';

export function assert_approx(a: vector3d, b: vector3d, eps = 1e-33): void {
    assert.approximately(a[0], b[0], eps);
    assert.approximately(a[1], b[1], eps);
    assert.approximately(a[2], b[2], eps);
}
