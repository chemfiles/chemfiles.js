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

export function ref(type: "double" | "bool"): any {
    const ptr = ffi.malloc(1);
    let get;
    if (type === "double") {
        get = () => ffi.getValue(ptr, "double") as number;
    } else if (type === "bool") {
        get = () => {
            const raw = ffi.getValue(ptr, "i8") as number;
            return raw !== 0;
        }
    }

    return {
        ptr: ptr,
        get: get,
        free: () => ffi.free(ptr),
    }
}
