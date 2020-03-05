import * as lib from './libchemfiles';
import {CHFL_PROPERTY, chfl_property_kind} from './libchemfiles';

import {vector3d, autogrowStrBuffer, check} from './utils';
import {stackAutoclean, stackAlloc, getValue} from './stack';

export type PropertyType = string | boolean | number | vector3d;

export function getProperty(property: CHFL_PROPERTY) {
    return stackAutoclean(() => {
        const kind = propertyKind(property);
        if (kind === chfl_property_kind.CHFL_PROPERTY_BOOL) {
            const value = stackAlloc("bool");
            check(lib._chfl_property_get_bool(property, value.ptr));
            return getValue(value);
        } else if (kind === chfl_property_kind.CHFL_PROPERTY_DOUBLE) {
            const value = stackAlloc("double");
            check(lib._chfl_property_get_double(property, value.ptr));
            return getValue(value);
        } else if (kind === chfl_property_kind.CHFL_PROPERTY_STRING) {
            return autogrowStrBuffer((ptr, size) => {
                check(lib._chfl_property_get_string(property, ptr, size, 0));
            });
        } else if (kind === chfl_property_kind.CHFL_PROPERTY_VECTOR3D) {
            const ref = stackAlloc("chfl_vector3d");
            check(lib._chfl_property_get_vector3d(property, ref.ptr));
            return getValue(ref);
        } else {
            throw Error("unknown chfl_property_kind, this is a bug");
        }
    })
}

export function createProperty(value: PropertyType): CHFL_PROPERTY {
    let property;
    if (typeof value === "string") {
        property = stackAutoclean(() => {
            const ref = stackAlloc("char*", {initial: value});
            return lib._chfl_property_string(ref.ptr);
        });
    } else if (typeof value === "number") {
        property = lib._chfl_property_double(value);
    } else if (typeof value === "boolean") {
        property = lib._chfl_property_bool(Number(value));
    } else if (typeof value === "object" && value.length === 3) {
        property = stackAutoclean(() => {
            const ref = stackAlloc("chfl_vector3d", {initial: value});
            return lib._chfl_property_vector3d(ref.ptr);
        });
    } else {
        throw Error(`unable to create a property with '${value}': unknown type`);
    }

    if (property === 0) {
        throw Error(`unable to create property with '${value}': failed allocation`);
    }

    return property;
}

function propertyKind(property: CHFL_PROPERTY): chfl_property_kind {
    return stackAutoclean(() => {
        const ref = stackAlloc("chfl_property_kind");
        check(lib._chfl_property_get_kind(property, ref.ptr));
        return getValue(ref);
    });
}
