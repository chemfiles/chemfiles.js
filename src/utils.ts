import {strict as assert} from 'assert';
import {ffi} from './libchemfiles';
import {stackAlloc} from './stack';

export type vector3d = [number, number, number];

export function offset(ptr: ffi.POINTER, size: number): ffi.POINTER {
    assert(size >= 0), "size should be positive";
    assert(size % 1 === 0, "size should be an integer");
    return (ptr + size) as ffi.POINTER;
}

type StrCallback = (ptr: ffi.c_char_ptr, size: number) => void;
export function autogrowStrBuffer(callback: StrCallback, initial = 128): string {
    const buffer_was_big_enough = (ptr: ffi.c_char_ptr, size: number) => {
        if (size < 2) {
            return false;
        } else {
            return ffi.getValue(offset(ptr, size - 2), 'i8') === 0;
        }
    }

    const sp = ffi.stackSave();
    let size = initial;
    let value = stackAlloc("char*", "\0".repeat(size));
    callback(value.ptr, size);

    while (!buffer_was_big_enough(value.ptr, size)) {
        // grow the buffer and retry
        size *= 2;
        ffi.stackRestore(sp);
        value = stackAlloc("char*", "\0".repeat(size));
        callback(value.ptr, size);
    }

    const result = ffi.UTF8ToString(value.ptr);
    ffi.stackRestore(sp);
    return result;
}
