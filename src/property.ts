import {ffi, chfl_property_kind} from './libchemfiles';
import {vector3d, autogrowStrBuffer} from './utils';
import {stackAutoclean, stackAlloc, getValue} from './stack';

export class Property {
    private handle!: ffi.CHFL_PROPERTY;

    constructor(value: string | number | boolean | vector3d) {
        let handle;
        if (typeof value === "string") {
            handle = stackAutoclean(() => {
                const ref = stackAlloc("char*", value);
                return ffi.chfl_property_string(ref.ptr);
            });
        } else if (typeof value === "number") {
            handle = ffi.chfl_property_double(value);
        } else if (typeof value === "boolean") {
            handle = ffi.chfl_property_bool(Number(value));
        } else if (typeof value === "object") {
            throw Error("not yet implemented");
        } else {
            throw Error("invalid type");
        }
        return Property.from_ptr(handle);
    }

    delete() {
        ffi.chfl_free(this.handle);
        this.handle = 0 as ffi.CHFL_PROPERTY;
    }

    get(): string | number | boolean | vector3d {
        return stackAutoclean(() => {
            const k = this.kind();
            if (k === chfl_property_kind.CHFL_PROPERTY_BOOL) {
                const value = stackAlloc("bool");
                ffi.chfl_property_get_bool(this.handle, value.ptr);
                return getValue(value);
            } else if (k === chfl_property_kind.CHFL_PROPERTY_DOUBLE) {
                const value = stackAlloc("double");
                ffi.chfl_property_get_double(this.handle, value.ptr);
                return getValue(value);
            } else if (k === chfl_property_kind.CHFL_PROPERTY_STRING) {
                return autogrowStrBuffer((ptr, size) => {
                    ffi.chfl_property_get_string(this.handle, ptr, size, 0);
                });
            } else if (k === chfl_property_kind.CHFL_PROPERTY_VECTOR3D) {
                throw Error("not yet implemented");
            } else {
                throw Error("invalid type");
            }
        })
    }

    private kind(): ffi.chfl_property_kind {
        const ptr = ffi.malloc(1) as ffi.chfl_property_kind_ptr;
        ffi.chfl_property_get_kind(this.handle, ptr);
        const result = ffi.getValue(ptr, 'i32') as ffi.chfl_property_kind;
        ffi.free(ptr);
        return result;
    }

    static from_ptr(handle: ffi.CHFL_PROPERTY): Property {
        if (handle === 0) {
            throw Error("null");
        }
        const property = Object.create(this.prototype);
        property.handle = handle;
        return property;
    }
}
