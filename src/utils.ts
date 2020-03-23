import * as lib from './libchemfiles';
import {c_char_ptr} from './libchemfiles';

import {stackAlloc} from './stack';
import {lastError} from './misc';

/** Simple 3D vector */
export interface vector3d {
    0: number;
    1: number;
    2: number;

    length: number;
}

/** 3x3 matrix */
export interface matrix3 {
    0: vector3d;
    1: vector3d;
    2: vector3d;

    length: number;
}

export function check(status: lib.chfl_status) {
    if (status === lib.chfl_status.CHFL_SUCCESS) {
        return;
    } else {
        throw Error(lastError())
    }
}

export function numberToInt64(value: number): {lo: number, hi: number} {
    const lo = value & 0x7fffffff;
    const hi = (value - lo) / 0x40000000;
    return { lo, hi };
}

export function isUnsignedInteger(value: number): boolean {
    return Number.isInteger(value) && value >= 0;
}

type StrCallback = (ptr: c_char_ptr, size: number) => void;
export function autogrowStrBuffer(callback: StrCallback, initial = 128): string {
    const buffer_was_big_enough = (ptr: c_char_ptr, size: number) => {
        if (size < 2) {
            return false;
        } else {
            return lib.HEAP8[ptr + size - 2] === 0;
        }
    }

    const sp = lib.stackSave();
    let size = initial;
    let value = stackAlloc("char*", {initial: "\0".repeat(size)});
    callback(value.ptr, size);

    while (!buffer_was_big_enough(value.ptr, size)) {
        // grow the buffer and retry
        size *= 2;
        lib.stackRestore(sp);
        value = stackAlloc("char*", {initial: "\0".repeat(size)});
        callback(value.ptr, size);
    }

    const result = lib.UTF8ToString(value.ptr);
    lib.stackRestore(sp);
    return result;
}
