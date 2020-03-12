import {strict as assert} from 'assert';

import * as lib from './libchemfiles';
import {c_uint64_ptr, c_double_ptr, c_bool_ptr, c_char_ptr, c_char_ptr_ptr} from './libchemfiles';
import {chfl_property_kind_ptr, chfl_cellshape_ptr, chfl_bond_order_ptr} from './libchemfiles';
import {chfl_vector3d, POINTER} from './libchemfiles';

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
    'uint64_t[]': [c_uint64_ptr, number[]];
    'double': [c_double_ptr, number];
    'bool': [c_bool_ptr, boolean];
    'char*': [c_char_ptr, string];
    'char*[]': [c_char_ptr_ptr, Array<string>];
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

interface AllocOptions {
    initial: string | vector3d;
    count: number;
}

/**
 * Allocate memory for the given type on the WASM stack and return a pointer
 * to it.
 *
 * If a `string` value is given, it will be converted to UTF8 and stored on the
 * stack. The returned pointer will point to the first character. In this case,
 * the `type` should be `'char*'`.
 */
export function stackAlloc<T extends keyof TypeMap>(type: T, opts: Partial<AllocOptions> = {}): Ref<T> {
    let ptr;

    if (opts.initial !== undefined) {
        assert(
            type === 'char*' || type === 'chfl_vector3d',
            "Can only pass initial value to stackAlloc if type is char* or chfl_vector3d"
        );
    }

    if (opts.count !== undefined && !type.includes("[]")) {
        throw Error('`count` is only relevant for array types in stackAlloc')
    }

    // and then scalar values or fixed size array
    if (type === "uint64_t") {
        ptr = lib.stackAlloc(sizes.SIZEOF_UINT64_T) as c_uint64_ptr;
    } else if (type === "double") {
        ptr = lib.stackAlloc(sizes.SIZEOF_DOUBLE) as c_double_ptr;
    } else if (type === "bool") {
        ptr = lib.stackAlloc(sizes.SIZEOF_BOOL) as c_bool_ptr;
    } else if (type === "char*") {
        checkString(opts.initial);
        const size = 4 * opts.initial.length + 1;
        ptr = lib.stackAlloc(size) as c_char_ptr;
        lib.stringToUTF8(opts.initial, ptr, size);
    } else if (type === "chfl_vector3d") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_VECTOR3D) as chfl_vector3d;
        if (opts.initial !== undefined) {
            checkVector3d(opts.initial);
            const start = ptr / sizes.SIZEOF_DOUBLE;
            lib.HEAPF64[start + 0] = opts.initial[0];
            lib.HEAPF64[start + 1] = opts.initial[1];
            lib.HEAPF64[start + 2] = opts.initial[2];
        }
    } else if (type === "chfl_matrix3") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_VECTOR3D * 3) as c_double_ptr;
    } else if (type === "chfl_property_kind") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_PROPERTY_KIND) as chfl_property_kind_ptr;
    } else if (type === "chfl_cellshape") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_CELLSHAPE) as chfl_cellshape_ptr;
    } else if (type === "chfl_bond_order") {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_BOND_ORDER) as chfl_bond_order_ptr;
    } else if (type.includes("[]")) {
        if (opts.count !== undefined) {
            if (type === "char*[]") {
                ptr = lib.stackAlloc(sizes.SIZEOF_VOID_P * opts.count) as c_char_ptr_ptr;
            } else if (type === "uint64_t[]") {
                ptr = lib.stackAlloc(sizes.SIZEOF_UINT64_T * opts.count) as c_double_ptr;
            } else {
                throw Error(`invalid array type '${type}' passed to stackAlloc`)
            }
        } else {
            throw Error(`missing 'count' option to stackAlloc for array type '${type}'`);
        }
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

export function getValue<T extends keyof TypeMap>(ref: Ref<T>, opts: {count?: number} = {}): TypeMap[T][1] {
    // deal with arrays first
    if (opts.count !== undefined) {
        let current = ref.ptr as POINTER;
        if (ref.type === "char*[]") {
            const values = [];
            for (let i=0; i<opts.count; i++) {
                const ptr = lib.getValue(current, '*') as c_char_ptr;
                values.push(lib.UTF8ToString(ptr));
                current = current + sizes.SIZEOF_VOID_P as POINTER;
            }
            return values;
        } else if (ref.type === "uint64_t[]") {
            const values = [];
            for (let i=0; i<opts.count; i++) {
                values.push(getUint64(current));
                current = current + sizes.SIZEOF_UINT64_T as POINTER;
            }
            return values;
        } else {
            throw Error('`count` is only relevant for array types in getValue')
        }
    } else if (ref.type.includes("[]")) {
        throw Error(`missing 'count' option to getValue for array type '${ref.type}'`);
    }

    // and then scalar values or fixed size array
    if (ref.type === "uint64_t") {
        return getUint64(ref.ptr);
    } else if (ref.type === "double") {
        return lib.getValue(ref.ptr, "double");
    } else if (ref.type === "bool") {
        return lib.getValue(ref.ptr, "i8") !== 0;
    } else if (ref.type === "char*") {
        return lib.UTF8ToString(ref.ptr);
    } else if (ref.type === "chfl_vector3d") {
        const start = ref.ptr / sizes.SIZEOF_DOUBLE;
        return lib.HEAPF64.slice(start, start + 3) as unknown as vector3d;
    } else if (ref.type === "chfl_matrix3") {
        const start = ref.ptr / sizes.SIZEOF_DOUBLE;
        const a = lib.HEAPF64.slice(start + 0, start + 3) as unknown as vector3d;
        const b = lib.HEAPF64.slice(start + 3, start + 6) as unknown as vector3d;
        const c = lib.HEAPF64.slice(start + 6, start + 9) as unknown as vector3d;
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

function getUint64(ptr: POINTER): number {
    // little dance to extract an unsigned 64-bit integer without using
    // `BigUint64Array`, which is not yet available on all browsers
    const SIZEOF_UINT32_T = sizes.SIZEOF_UINT64_T / 2;
    const lo = lib.HEAP32[ptr / SIZEOF_UINT32_T];
    ptr = ptr + SIZEOF_UINT32_T as POINTER;
    const hi = lib.HEAP32[ptr / SIZEOF_UINT32_T];
    return (hi & 0xffffff) * 0x40000000 + (lo & 0xffffffff);
}
