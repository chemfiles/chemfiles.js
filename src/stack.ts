import {strict as assert} from 'assert';

import * as lib from './libchemfiles';
import {c_uint64_ptr, c_double_ptr, c_bool_ptr, c_char_ptr} from './libchemfiles';
import {chfl_property_kind_ptr, chfl_cellshape_ptr, chfl_bond_order_ptr} from './libchemfiles';
import {chfl_vector3d} from './libchemfiles';

import {vector3d, matrix3} from './utils';
import * as sizes from '../lib/wasm-sizes';

/**
 * Call the provided callback and clean the WASM stack before returning
 *
 * @return the values returned by the `callback`
 */
export function stackAutoclean<T>(callback: () => T): T {
    const position = lib.stackSave();
    const value = callback();
    lib.stackRestore(position);
    return value;
}

/**
 * Mapping between c types => [WASM types, javascript type]
 */
type TypeMap = {
    'uint64_t': [c_uint64_ptr, number];
    'double': [c_double_ptr, number];
    'bool': [c_bool_ptr, boolean];
    'char*': [c_char_ptr, string];
    'chfl_vector3d': [chfl_vector3d, vector3d];
    'chfl_matrix3': [c_double_ptr, matrix3]
    'chfl_property_kind': [chfl_property_kind_ptr, number];
    'chfl_cellshape': [chfl_cellshape_ptr, number];
    'chfl_bond_order': [chfl_bond_order_ptr, number];
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
export function stackAlloc<T extends keyof TypeMap>(type: T, value?: string | vector3d): Ref<T> {
    let ptr;

    if (value !== undefined) {
        assert(
            type === 'char*' || type === 'chfl_vector3d',
            "Can only pass string value to stackAlloc if type is char* or chfl_vector3d"
        );
    }

    if (type === "uint64_t") {
        ptr = lib.stackAlloc(sizes.SIZEOF_UINT64_T) as c_uint64_ptr;
    } else if (type === "double") {
        ptr = lib.stackAlloc(sizes.SIZEOF_DOUBLE) as c_double_ptr;
    } else if (type === "bool") {
        ptr = lib.stackAlloc(sizes.SIZEOF_BOOL) as c_bool_ptr;
    } else if (type === "char*") {
        checkString(value);
        const size = 4 * value.length + 1;
        ptr = lib.stackAlloc(size) as c_char_ptr;
        lib.stringToUTF8(value, ptr, size);
    } else if (type === "chfl_vector3d") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_VECTOR3D) as chfl_vector3d;
        if (value !== undefined) {
            checkVector3d(value);
            const start = ptr / sizes.SIZEOF_DOUBLE;
            lib.HEAPF64[start + 0] = value[0];
            lib.HEAPF64[start + 1] = value[1];
            lib.HEAPF64[start + 2] = value[2];
        }
    } else if (type === "chfl_matrix3") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_VECTOR3D * 3) as c_double_ptr;
    } else if (type === "chfl_property_kind") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_PROPERTY_KIND) as chfl_property_kind_ptr;
    } else if (type === "chfl_cellshape") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_CELLSHAPE) as chfl_cellshape_ptr;
    } else if (type === "chfl_bond_order") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_BOND_ORDER) as chfl_bond_order_ptr;
    } else {
        throw Error(`invalid type '${type}' passed to stackAlloc`)
    }
    return {ptr, type};
}

// required for the lib.getValue call with LLVM types
assert(sizes.SIZEOF_BOOL == 1, "sizeof(bool) must be 1 in WASM");
assert(sizes.SIZEOF_CHFL_PROPERTY_KIND == 4, "sizeof(chfl_property_kind) must be 4 in WASM");
assert(sizes.SIZEOF_CHFL_CELLSHAPE == 4, "sizeof(chfl_cellshape) must be 4 in WASM");
assert(sizes.SIZEOF_CHFL_BOND_ORDER == 4, "sizeof(chfl_bond_order) must be 4 in WASM");

export function getValue<T extends keyof TypeMap>(ref: Ref<T>): TypeMap[T][1] {
    if (ref.type === "uint64_t") {
        // there is no u64 exposed with getValue, but i64 should be fine for
        // values below INT64_MAX. This should always be the case since
        // uint64_t are used to pass size_t values, and WASM is 32-bit only
        return lib.getValue(ref.ptr, "i64");
    } else if (ref.type === "double") {
        return lib.getValue(ref.ptr, "double");
    } else if (ref.type === "bool") {
        return lib.getValue(ref.ptr, "i8") !== 0;
    } else if (ref.type === "char*") {
        return lib.UTF8ToString(ref.ptr);
    } else if (ref.type === "chfl_vector3d") {
        const start = ref.ptr / sizes.SIZEOF_DOUBLE;
        return lib.HEAPF64.slice(start, start + 3) as vector3d;
    } else if (ref.type === "chfl_matrix3") {
        const start = ref.ptr / sizes.SIZEOF_DOUBLE;
        const a = lib.HEAPF64.slice(start + 0, start + 3) as vector3d;
        const b = lib.HEAPF64.slice(start + 3, start + 6) as vector3d;
        const c = lib.HEAPF64.slice(start + 6, start + 9) as vector3d;
        return [a, b, c];
    } else if (ref.type === "chfl_property_kind") {
        return lib.getValue(ref.ptr, "i32");
    } else if (ref.type === "chfl_cellshape") {
        return lib.getValue(ref.ptr, "i32");
    } else if (ref.type === "chfl_bond_order") {
        return lib.getValue(ref.ptr, "i32");
    } else {
        throw Error(`invalid type '${ref.type}' passed to getValue`)
    }
}

function checkString(value?: any): asserts value is string {
    assert(value !== undefined && typeof value === "string");
}

function checkVector3d(value?: any): asserts value is vector3d {
    assert(value !== undefined && typeof value === "object" && value.length === 3);
}
