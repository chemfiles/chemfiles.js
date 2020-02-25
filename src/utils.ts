import { strict as assert } from 'assert';
import {ffi} from './libchemfiles';

export type vector3d = [number, number, number];

export function str2wasm(value: string): ffi.c_char_ptr {
    const buflen = value.length * 4 + 1;
    const ptr = ffi.malloc(buflen) as ffi.c_char_ptr;
    ffi.stringToUTF8(value, ptr, buflen);
    return ptr;
}

interface Reference<WASM, JS> {
    ptr: WASM;
    get(): JS;
    free(): void;
}

export function ref(type: "double"): Reference<ffi.c_double_ptr, number>;
export function ref(type: "bool"): Reference<ffi.c_bool_ptr, boolean>;
export function ref(type: "uint64_t"): Reference<ffi.c_uint64_ptr, number>;

export function ref(type: "double" | "bool" | "uint64_t"): any {
    const ptr = ffi.malloc(1);
    let get;
    if (type === "double") {
        get = () => ffi.getValue(ptr, "double");
    } else if (type === "bool") {
        get = () => ffi.getValue(ptr, "i8") !== 0;
    } else if (type === "uint64_t") {
        get = () => ffi.getValue(ptr, "i64");
    } else {
        throw Error(`invalid type passed to ref: ${type}`);
    }

    return {
        ptr: ptr,
        get: get,
        free: () => ffi.free(ptr),
    }
}

export function offset(ptr: ffi.POINTER, size: number): ffi.POINTER {
    assert(size >= 0), "size should be positive";
    assert(size % 1 === 0, "size should be an integer");
    return (ptr + size) as ffi.POINTER;
}

type StrCallback = (ptr: ffi.c_char_ptr, size: number) => void;
export function autogrowStrBuffer(callback: StrCallback, initial = 128) {
    const buffer_was_big_enough = (ptr: ffi.c_char_ptr, size: number) => {
        if (size < 2) {
            return false;
        } else {
            return ffi.getValue(offset(ptr, size - 2), 'i8') === 0;
        }
    }

    let size = initial;
    let ptr = ffi.malloc(size) as ffi.c_char_ptr;
    callback(ptr, size);

    while (!buffer_was_big_enough(ptr, size)) {
        // grow the buffer and retry
        size *= 2;
        ffi.free(ptr);
        ptr = ffi.malloc(size) as ffi.c_char_ptr;
        callback(ptr, size);
    }

    const value = ffi.UTF8ToString(ptr);
    ffi.free(ptr);
    return value;
}
