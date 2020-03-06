import * as lib from './libchemfiles';
import {c_char_ptr} from './libchemfiles';

import {stackAlloc} from './stack';
import {lastError} from './misc';

/** Simple 3D vector */
export type vector3d = [number, number, number];

/** 3x3 matrix */
export type matrix3 = [vector3d, vector3d, vector3d];

export function check(status: lib.chfl_status) {
    if (status === lib.chfl_status.CHFL_SUCCESS) {
        return;
    } else {
        throw Error(lastError())
    }
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
