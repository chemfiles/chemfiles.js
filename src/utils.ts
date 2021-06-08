import { CHFL_SUCCESS, c_char_ptr, chfl_status } from './libchemfiles';
import { lib } from './misc';

import { lastError } from './misc';
import { getValue, stackAlloc } from './stack';

/** Simple 3D vector */
export interface Vector3D {
    0: number;
    1: number;
    2: number;

    length: number;
}

/** 3x3 matrix */
export interface Matrix3 {
    0: Vector3D;
    1: Vector3D;
    2: Vector3D;

    length: number;
}

export function isVector3D(o: unknown): o is Vector3D {
    return (
        Array.isArray(o) &&
        o.length === 3 &&
        typeof o[0] === 'number' &&
        typeof o[1] === 'number' &&
        typeof o[2] === 'number'
    );
}

export function isMatrix3(o: unknown): o is Matrix3 {
    return (
        Array.isArray(o) &&
        o.length === 3 &&
        isVector3D(o[0]) &&
        isVector3D(o[1]) &&
        isVector3D(o[2])
    );
}

export function check(status: chfl_status): void {
    if (status === CHFL_SUCCESS) {
        return;
    } else {
        throw Error(lastError());
    }
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
    let value = stackAlloc('char*', { initial: '\0'.repeat(size) });
    callback(value.ptr, size);

    while (!bigEnoughBuffer(value.ptr, size)) {
        // grow the buffer and retry
        size *= 2;
        lib.stackRestore(sp);
        value = stackAlloc('char*', { initial: '\0'.repeat(size) });
        callback(value.ptr, size);
    }

    const result = getValue(value);
    lib.stackRestore(sp);
    return result;
}

export function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw Error(message);
    }
}
