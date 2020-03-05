import * as lib from './libchemfiles';
import {CHFL_ATOM} from './libchemfiles';

import {Pointer} from './c_ptr';

import {stackAlloc, stackAutoclean, getValue} from './stack';
import {autogrowStrBuffer, check} from './utils';
import {PropertyType, getProperty, createProperty} from './property';

export class Atom extends Pointer<CHFL_ATOM> {
    constructor(name: string, type?: string) {
        const ptr = stackAutoclean(() => {
            const value = stackAlloc("char*", {initial: name});
            return lib._chfl_atom(value.ptr);
        });
        super(ptr, false);

        if (type !== undefined) {
            this.type = type;
        }
    }

    static clone(other: Atom): Atom {
        const ptr = lib._chfl_atom_copy(other.const_ptr);
        return Atom.__from_ptr(ptr);
    }

    get mass(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            check(lib._chfl_atom_mass(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    set mass(mass: number) {
        check(
            lib._chfl_atom_set_mass(this.ptr, mass)
        );
    }

    get charge(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            check(lib._chfl_atom_charge(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    set charge(charge: number) {
        check(lib._chfl_atom_set_charge(this.ptr, charge));
    }

    get name(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_atom_name(this.const_ptr, ptr, size, 0));
        });
    }

    set name(name: string) {
        stackAutoclean(() => {
            const value = stackAlloc("char*", {initial: name});
            check(lib._chfl_atom_set_name(this.ptr, value.ptr));
        });
    }

    get type(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_atom_type(this.const_ptr, ptr, size, 0));
        });
    }

    set type(type: string) {
        stackAutoclean(() => {
            const value = stackAlloc("char*", {initial: type});
            check(lib._chfl_atom_set_type(this.ptr, value.ptr));
        });
    }

    get fullName(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_atom_full_name(this.const_ptr, ptr, size, 0));
        });
    }

    get VdWRadius(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            check(lib._chfl_atom_vdw_radius(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    get covalentRadius(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            check(lib._chfl_atom_covalent_radius(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    get atomicNumber(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("uint64_t");
            check(lib._chfl_atom_atomic_number(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    get(name: string): PropertyType | undefined {
        return stackAutoclean(() => {
            const value = stackAlloc("char*", {initial: name});
            const property = lib._chfl_atom_get_property(this.const_ptr, value.ptr);
            if (property === 0) {
                return undefined;
            } else {
                const result = getProperty(property);
                lib._chfl_free(property);
                return result;
            }
        });
    }

    set(name: string, value: PropertyType): void {
        return stackAutoclean(() => {
            const property = createProperty(value);
            const wasmName = stackAlloc("char*", {initial: name});
            check(lib._chfl_atom_set_property(this.ptr, wasmName.ptr, property));
            lib._chfl_free(property);
        })
    }

    properties(): string[] {
        return stackAutoclean(() => {
            const countRef = stackAlloc("uint64_t");
            check(lib._chfl_atom_properties_count(this.ptr, countRef.ptr));
            const count = getValue(countRef);

            const names = stackAlloc("char**", {count});
            check(lib._chfl_atom_list_properties(this.ptr, names.ptr, count, 0));
            return getValue(names);
        });
    }

    /** @internal
     * Create a new Atom from a raw pointer
     */
    static __from_ptr(ptr: CHFL_ATOM): Atom {
        const parent = new Pointer(ptr, true);
        const atom = Object.create(Atom.prototype);
        Object.assign(atom, parent);
        return atom;
    }
}
