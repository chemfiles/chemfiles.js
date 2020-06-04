import * as lib from './libchemfiles';
import {c_char_ptr} from './libchemfiles';

import {lastError} from './misc';
import {getValue, stackAlloc} from './stack';

/** Simple 3D vector */
export interface Vector3d {
    0: number;
    1: number;
    2: number;

    length: number;
}

/** 3x3 matrix */
export interface Matrix3 {
    0: Vector3d;
    1: Vector3d;
    2: Vector3d;

    length: number;
}

export function check(status: lib.chfl_status): void {
    if (status === lib.chfl_status.CHFL_SUCCESS) {
        return;
    } else {
        throw Error(lastError());
    }
}

export function numberEmscriptenUint64(value: number): {lo: number, hi: number} {
    const lo = value & 0x7fffffff;
    const hi = (value - lo) / 0x40000000;
    return { lo, hi };
}

export function isUnsignedInteger(value: number): boolean {
    return Number.isInteger(value) && value >= 0;
}

type StrCallback = (ptr: c_char_ptr, size: number) => void;
export function autogrowStrBuffer(callback: StrCallback, initial = 128): string {
    const bigEnoughBuffer = (ptr: c_char_ptr, len: number) => {
        if (len < 2) {
            return false;
        } else {
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            return lib.HEAP8[ptr + len - 2] === 0;
        }
    };

    const sp = lib.stackSave();
    let size = initial;
    let value = stackAlloc('char*', {initial: '\0'.repeat(size)});
    callback(value.ptr, size);

    while (!bigEnoughBuffer(value.ptr, size)) {
        // grow the buffer and retry
        size *= 2;
        lib.stackRestore(sp);
        value = stackAlloc('char*', {initial: '\0'.repeat(size)});
        callback(value.ptr, size);
    }

    const result = getValue(value);
    lib.stackRestore(sp);
    return result;
}
