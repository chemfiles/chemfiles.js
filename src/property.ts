import {strict as assert} from 'assert';

import {ffi, chfl_property_kind} from './libchemfiles';
import {vector3d, autogrowStrBuffer} from './utils';
import {stackAutoclean, stackAlloc, getValue} from './stack';
import {SIZEOF_DOUBLE} from '../lib/wasm-sizes';

export type PropertyType = string | boolean | number | vector3d;

export function getProperty(property: ffi.CHFL_PROPERTY) {
    return stackAutoclean(() => {
        const kind = propertyKind(property);
        if (kind === chfl_property_kind.CHFL_PROPERTY_BOOL) {
            const value = stackAlloc("bool");
            ffi.chfl_property_get_bool(property, value.ptr);
            return getValue(value);
        } else if (kind === chfl_property_kind.CHFL_PROPERTY_DOUBLE) {
            const value = stackAlloc("double");
            ffi.chfl_property_get_double(property, value.ptr);
            return getValue(value);
        } else if (kind === chfl_property_kind.CHFL_PROPERTY_STRING) {
            return autogrowStrBuffer((ptr, size) => {
                ffi.chfl_property_get_string(property, ptr, size, 0);
            });
        } else if (kind === chfl_property_kind.CHFL_PROPERTY_VECTOR3D) {
            const ref = stackAlloc("chfl_vector3d");
            ffi.chfl_property_get_vector3d(property, ref.ptr)
            const start = ref.ptr / SIZEOF_DOUBLE;
            return ffi.HEAPF64.slice(start, start + 3) as vector3d;
        } else {
            throw Error("unknown chfl_property_kind, this is a bug");
        }
    })
}

export function createProperty(value: PropertyType): ffi.CHFL_PROPERTY {
    let property;
    if (typeof value === "string") {
        property = stackAutoclean(() => {
            const ref = stackAlloc("char*", value);
            return ffi.chfl_property_string(ref.ptr);
        });
    } else if (typeof value === "number") {
        property = ffi.chfl_property_double(value);
    } else if (typeof value === "boolean") {
        property = ffi.chfl_property_bool(Number(value));
    } else if (typeof value === "object") {
        property = stackAutoclean(() => {
            const ref = stackAlloc("chfl_vector3d");
            const start = ref.ptr / SIZEOF_DOUBLE;
            ffi.HEAPF64[start + 0] = value[0];
            ffi.HEAPF64[start + 1] = value[1];
            ffi.HEAPF64[start + 2] = value[2];
            return ffi.chfl_property_vector3d(ref.ptr);
        });
    } else {
        throw Error("invalid type");
    }

    // TODO: null checks

    return property;
}

function propertyKind(property: ffi.CHFL_PROPERTY): ffi.chfl_property_kind {
    return stackAutoclean(() => {
        const ref = stackAlloc("chfl_property_kind");
        ffi.chfl_property_get_kind(property, ref.ptr);
        return getValue(ref);
    });
}
