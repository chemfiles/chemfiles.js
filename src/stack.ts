import {strict as assert} from 'assert';
import {ffi} from './libchemfiles';
import * as sizes from '../lib/wasm-sizes';

/**
 * Call the provided callback and clean the WASM stack before returning
 *
 * @return the values returned by the `callback`
 */
export function stackAutoclean<T>(callback: () => T): T {
    const position = ffi.stackSave();
    const value = callback();
    ffi.stackRestore(position);
    return value;
}

/**
 * Mapping between c types => [WASM types, javascript type]
 */
type TypeMap = {
    'uint64_t': [ffi.c_uint64_ptr, number];
    'double': [ffi.c_double_ptr, number];
    'bool': [ffi.c_bool_ptr, boolean];
    'char*': [ffi.c_char_ptr, string];
}

/**
 * Stack allocated pointer for calling WASM functions
 */
interface Ref<T extends keyof TypeMap> {
    /** pointer to the stack-allocated memory */
    readonly ptr: TypeMap[T][0],
    /** C type of the pointer, to be used with TypeMap */
    readonly type: T,
}

/**
 * Allocate memory for the given type on the WASM stack and return a pointer
 * to it.
 *
 * If a `string` value is given, it will be converted to UTF8 and stored on the
 * stack. The returned pointer will point to the first character. In this case,
 * the `type` should be `'char*'`.
 */
export function stackAlloc<T extends keyof TypeMap>(type: T, value?: string): Ref<T> {
    let ptr;

    if (value !== undefined) {
        assert(type === 'char*', "Can only pass string value to stackAlloc if type is char*");
    }

    if (type === "uint64_t") {
        ptr = ffi.stackAlloc(sizes.SIZEOF_UINT64_T) as ffi.c_uint64_ptr;
    } else if (type === "double") {
        ptr = ffi.stackAlloc(sizes.SIZEOF_DOUBLE) as ffi.c_double_ptr;
    } else if (type === "bool") {
        ptr = ffi.stackAlloc(sizes.SIZEOF_BOOL) as ffi.c_bool_ptr;
    } else if (type === "char*") {
        assert(value !== undefined);
        const size = 4 * value!.length + 1;
        ptr = ffi.stackAlloc(size) as ffi.c_char_ptr;
        ffi.stringToUTF8(value!, ptr, size);
    } else {
        throw Error("invalid type passed to stackAlloc")
    }
    return {ptr, type};
}

// required for the below call with 'i8' as LLVM type
assert(sizes.SIZEOF_BOOL == 1, "sizeof(bool) should be 1 in WASM");

export function getValue<T extends keyof TypeMap>(ref: Ref<T>): TypeMap[T][1] {
    if (ref.type === "uint64_t") {
        // there is no u64 exposed with getValue, but i64 should be fine for
        // values below INT64_MAX. This should always be the case since
        // uint64_t are used to pass size_t values, and WASM is 32-bit only
        return ffi.getValue(ref.ptr, "i64");
    } else if (ref.type === "double") {
        return ffi.getValue(ref.ptr, "double");
    } else if (ref.type === "bool") {
        return ffi.getValue(ref.ptr, "i8") !== 0;
    } else if (ref.type === "char*") {
        return ffi.UTF8ToString(ref.ptr);
    } else {
        throw Error("invalid type passed to getValue")
    }
}
