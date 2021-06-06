import * as sizes from '../lib/wasm-sizes';
import { lib } from './misc';
import { c_bool_ptr, c_char_ptr, c_char_ptr_ptr, c_double_ptr, c_uint64_ptr } from './libchemfiles';
import { chfl_bond_order_ptr, chfl_cellshape_ptr, chfl_property_kind_ptr } from './libchemfiles';
import { POINTER, chfl_vector3d } from './libchemfiles';

import { CellShape } from './cell';
import { BondOrder } from './topology';
import { Matrix3, Vector3D, assert, isMatrix3, isVector3D } from './utils';

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
 * Mapping between C types => [WASM types, TypeScript type]
 */
interface TypeMap {
    uint64_t: [c_uint64_ptr, number];
    'uint64_t[]': [c_uint64_ptr, number[]];
    double: [c_double_ptr, number];
    bool: [c_bool_ptr, boolean];
    'char*': [c_char_ptr, string];
    'char*[]': [c_char_ptr_ptr, string[]];
    chfl_vector3d: [chfl_vector3d, Vector3D];
    chfl_matrix3: [c_double_ptr, Matrix3];
    chfl_property_kind: [chfl_property_kind_ptr, number];
    chfl_cellshape: [chfl_cellshape_ptr, CellShape];
    chfl_bond_order: [chfl_bond_order_ptr, BondOrder];
    'chfl_bond_order[]': [chfl_bond_order_ptr, BondOrder[]];
}

/**
 * Stack allocated pointer for calling WASM functions
 */
interface Ref<T extends keyof TypeMap> {
    /** pointer to the stack-allocated memory */
    readonly ptr: TypeMap[T][0];
    /** C type of the pointer, to be used with TypeMap */
    readonly type: T;
}

interface AllocOptions {
    initial: string | Vector3D | Matrix3;
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
export function stackAlloc<T extends keyof TypeMap>(
    type: T,
    opts: Partial<AllocOptions> = {}
): Ref<T> {
    let ptr;

    if (opts.initial !== undefined) {
        assert(
            type === 'char*' || type === 'chfl_vector3d' || type === 'chfl_matrix3',
            'Can only pass initial value to stackAlloc if type is char*, chfl_vector3d, or chfl_matrix3'
        );
    }

    if (opts.count !== undefined && !type.includes('[]')) {
        throw Error('`count` is only relevant for array types in stackAlloc');
    }

    // and then scalar values or fixed size array
    if (type === 'uint64_t') {
        ptr = lib.stackAlloc(sizes.SIZEOF_UINT64_T) as c_uint64_ptr;
    } else if (type === 'double') {
        ptr = lib.stackAlloc(sizes.SIZEOF_DOUBLE) as c_double_ptr;
    } else if (type === 'bool') {
        ptr = lib.stackAlloc(sizes.SIZEOF_BOOL) as c_bool_ptr;
    } else if (type === 'char*') {
        checkString(opts.initial);
        const size = 4 * opts.initial.length + 1;
        ptr = lib.stackAlloc(size) as c_char_ptr;
        lib.stringToUTF8(opts.initial, ptr, size);
    } else if (type === 'chfl_vector3d') {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_VECTOR3D) as chfl_vector3d;
        if (opts.initial !== undefined) {
            checkVector3d(opts.initial);
            const start = ptr / sizes.SIZEOF_DOUBLE;
            lib.HEAPF64[start + 0] = opts.initial[0];
            lib.HEAPF64[start + 1] = opts.initial[1];
            lib.HEAPF64[start + 2] = opts.initial[2];
        }
    } else if (type === 'chfl_matrix3') {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_VECTOR3D * 3) as c_double_ptr;
        if (opts.initial !== undefined) {
            checkMatrix3(opts.initial);
            const start = ptr / sizes.SIZEOF_DOUBLE;
            lib.HEAPF64[start + 0] = opts.initial[0][0];
            lib.HEAPF64[start + 1] = opts.initial[0][1];
            lib.HEAPF64[start + 2] = opts.initial[0][2];
            lib.HEAPF64[start + 3] = opts.initial[1][0];
            lib.HEAPF64[start + 4] = opts.initial[1][1];
            lib.HEAPF64[start + 5] = opts.initial[1][2];
            lib.HEAPF64[start + 6] = opts.initial[2][0];
            lib.HEAPF64[start + 7] = opts.initial[2][1];
            lib.HEAPF64[start + 8] = opts.initial[2][2];
        }
    } else if (type === 'chfl_property_kind') {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_PROPERTY_KIND) as chfl_property_kind_ptr;
    } else if (type === 'chfl_cellshape') {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_CELLSHAPE) as chfl_cellshape_ptr;
    } else if (type === 'chfl_bond_order') {
        ptr = lib.stackAlloc(sizes.SIZEOF_CHFL_BOND_ORDER) as chfl_bond_order_ptr;
    } else if (type.includes('[]')) {
        if (opts.count !== undefined) {
            if (type === 'char*[]') {
                ptr = lib.stackAlloc(sizes.SIZEOF_VOID_P * opts.count) as c_char_ptr_ptr;
            } else if (type === 'uint64_t[]') {
                ptr = lib.stackAlloc(sizes.SIZEOF_UINT64_T * opts.count) as c_double_ptr;
            } else if (type === 'chfl_bond_order[]') {
                ptr = lib.stackAlloc(
                    sizes.SIZEOF_CHFL_BOND_ORDER * opts.count
                ) as chfl_bond_order_ptr;
            } else {
                throw Error(`invalid array type '${type}' passed to stackAlloc`);
            }
        } else {
            throw Error(`missing 'count' option to stackAlloc for array type '${type}'`);
        }
    } else {
        throw Error(`invalid type '${type}' passed to stackAlloc`);
    }

    return { ptr, type };
}

// required for the lib.getValue call with LLVM types
assert(sizes.SIZEOF_BOOL === 1, 'sizeof(bool) must be 1 in WASM');
assert(sizes.SIZEOF_CHFL_PROPERTY_KIND === 4, 'sizeof(chfl_property_kind) must be 4 in WASM');
assert(sizes.SIZEOF_CHFL_CELLSHAPE === 4, 'sizeof(chfl_cellshape) must be 4 in WASM');
assert(sizes.SIZEOF_CHFL_BOND_ORDER === 4, 'sizeof(chfl_bond_order) must be 4 in WASM');

export function getValue<T extends keyof TypeMap>(
    ref: Ref<T>,
    opts: { count?: number } = {}
): TypeMap[T][1] {
    // deal with arrays first
    if (opts.count !== undefined) {
        let current = ref.ptr as POINTER;
        if (ref.type === 'char*[]') {
            const values = [];
            for (let i = 0; i < opts.count; i++) {
                const ptr = lib.getValue(current, '*') as c_char_ptr;
                values.push(lib.UTF8ToString(ptr));
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                current = (current + sizes.SIZEOF_VOID_P) as POINTER;
            }
            return values;
        } else if (ref.type === 'uint64_t[]') {
            const values = [];
            for (let i = 0; i < opts.count; i++) {
                values.push(getUint64(current));
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                current = (current + sizes.SIZEOF_UINT64_T) as POINTER;
            }
            return values;
        } else if (ref.type === 'chfl_bond_order[]') {
            const values = [];
            for (let i = 0; i < opts.count; i++) {
                values.push(lib.getValue(current, 'i32'));
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                current = (current + sizes.SIZEOF_CHFL_BOND_ORDER) as POINTER;
            }
            return values;
        } else {
            throw Error('`count` is only relevant for array types in getValue');
        }
    } else if (ref.type.includes('[]')) {
        throw Error(`missing 'count' option to getValue for array type '${ref.type}'`);
    }

    // and then scalar values or fixed size array
    if (ref.type === 'uint64_t') {
        return getUint64(ref.ptr);
    } else if (ref.type === 'double') {
        return lib.getValue(ref.ptr, 'double');
    } else if (ref.type === 'bool') {
        return lib.getValue(ref.ptr, 'i8') !== 0;
    } else if (ref.type === 'char*') {
        return lib.UTF8ToString(ref.ptr);
    } else if (ref.type === 'chfl_vector3d') {
        const start = ref.ptr / sizes.SIZEOF_DOUBLE;
        return lib.HEAPF64.slice(start, start + 3) as unknown as Vector3D;
    } else if (ref.type === 'chfl_matrix3') {
        const start = ref.ptr / sizes.SIZEOF_DOUBLE;
        const a = lib.HEAPF64.slice(start + 0, start + 3) as unknown as Vector3D;
        const b = lib.HEAPF64.slice(start + 3, start + 6) as unknown as Vector3D;
        const c = lib.HEAPF64.slice(start + 6, start + 9) as unknown as Vector3D;
        return [a, b, c];
    } else if (ref.type === 'chfl_property_kind') {
        return lib.getValue(ref.ptr, 'i32');
    } else if (ref.type === 'chfl_cellshape') {
        return lib.getValue(ref.ptr, 'i32');
    } else if (ref.type === 'chfl_bond_order') {
        return lib.getValue(ref.ptr, 'i32');
    } else {
        throw Error(`invalid type '${ref.type}' passed to getValue`);
    }
}

function checkString(value?: unknown): asserts value is string {
    assert(
        value !== undefined && typeof value === 'string',
        `expected a string value, got a ${typeof value} instead`
    );
}

function checkVector3d(value?: unknown): asserts value is Vector3D {
    assert(isVector3D(value), `expected a Vector3D value, got a ${typeof value} instead`);
}

function checkMatrix3(value?: unknown): asserts value is Matrix3 {
    assert(isMatrix3(value), `expected a Matrix3 value, got a ${typeof value} instead`);
}

export function getUint64(ptr: POINTER): number {
    // little dance to extract an unsigned 64-bit integer without using
    // `BigUint64Array`, which is not yet available on all browsers
    const SIZEOF_UINT32_T = sizes.SIZEOF_UINT64_T / 2;
    const lo = lib.HEAP32[ptr / SIZEOF_UINT32_T];
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    ptr = (ptr + SIZEOF_UINT32_T) as POINTER;
    const hi = lib.HEAP32[ptr / SIZEOF_UINT32_T];
    return (hi & 0xffffff) * 0x40000000 + (lo & 0xffffffff);
}
