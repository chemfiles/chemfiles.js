import { CHFL_PROPERTY } from './libchemfiles';
import {
    CHFL_PROPERTY_BOOL,
    CHFL_PROPERTY_DOUBLE,
    CHFL_PROPERTY_STRING,
    CHFL_PROPERTY_VECTOR3D,
    chfl_property_kind,
} from './libchemfiles';
import { lib } from './misc';

import { getValue, stackAlloc, stackAutoclean } from './stack';
import { Vector3d, autogrowStrBuffer, check } from './utils';

/**
 * Possible types for properties natively stored in [[Atom]], [[Residue]] or
 * [[Frame]].
 */
export type PropertyType = string | boolean | number | Vector3d;

/**
 * Get the javascript value from a CHFL_PROPERTY
 */
export function getProperty(property: CHFL_PROPERTY): PropertyType {
    return stackAutoclean(() => {
        const kind = propertyKind(property);
        if (kind === CHFL_PROPERTY_BOOL) {
            const value = stackAlloc('bool');
            check(lib._chfl_property_get_bool(property, value.ptr));
            return getValue(value);
        } else if (kind === CHFL_PROPERTY_DOUBLE) {
            const value = stackAlloc('double');
            check(lib._chfl_property_get_double(property, value.ptr));
            return getValue(value);
        } else if (kind === CHFL_PROPERTY_STRING) {
            return autogrowStrBuffer((ptr, size) => {
                check(lib._chfl_property_get_string(property, ptr, size, 0));
            });
        } else if (kind === CHFL_PROPERTY_VECTOR3D) {
            const ref = stackAlloc('chfl_vector3d');
            check(lib._chfl_property_get_vector3d(property, ref.ptr));
            return getValue(ref);
        } else {
            throw Error('unknown chfl_property_kind, this is a bug');
        }
    });
}

/**
 * Create a CHFL_PROPERTY from a javascript value
 */
export function createProperty(value: PropertyType): CHFL_PROPERTY {
    let property;
    if (typeof value === 'string') {
        property = stackAutoclean(() => {
            const ref = stackAlloc('char*', { initial: value });
            return lib._chfl_property_string(ref.ptr);
        });
    } else if (typeof value === 'number') {
        property = lib._chfl_property_double(value);
    } else if (typeof value === 'boolean') {
        property = lib._chfl_property_bool(Number(value));
    } else if (typeof value === 'object' && value.length === 3) {
        property = stackAutoclean(() => {
            const ref = stackAlloc('chfl_vector3d', { initial: value });
            return lib._chfl_property_vector3d(ref.ptr);
        });
    } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw Error(`unable to create a property with '${value}': unknown type`);
    }

    if (property === 0) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw Error(`unable to create property with '${value}': failed allocation`);
    }

    return property;
}

/**
 * Get the kind of a CHFL_PROPERTY
 */
function propertyKind(property: CHFL_PROPERTY): chfl_property_kind {
    return stackAutoclean(() => {
        const ref = stackAlloc('chfl_property_kind');
        check(lib._chfl_property_get_kind(property, ref.ptr));
        return getValue(ref) as chfl_property_kind;
    });
}
