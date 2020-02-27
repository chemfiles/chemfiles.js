import {ffi} from './libchemfiles';
import {stackAlloc, stackAutoclean, getValue} from './stack';
import {autogrowStrBuffer} from './utils';

export class Atom {
    private handle!: ffi.CHFL_ATOM;

    constructor(name: string) {
        return stackAutoclean(() => {
            const value = stackAlloc("char*", name);
            const handle = ffi.chfl_atom(value.ptr);
            return Atom.from_ptr(handle);
        });
    }

    delete() {
        ffi.chfl_free(this.handle);
        this.handle = 0 as ffi.CHFL_ATOM;
    }

    static from_ptr(handle: ffi.CHFL_ATOM): Atom {
        if (handle === 0) {
            throw Error("null");
        }
        const atom = Object.create(this.prototype);
        atom.handle = handle;
        return atom;
    }

    get mass(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            ffi.chfl_atom_mass(this.handle, value.ptr);
            return getValue(value);
        });
    }

    set mass(mass: number) {
        ffi.chfl_atom_set_mass(this.handle, mass);
    }

    get charge(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            ffi.chfl_atom_charge(this.handle, value.ptr);
            return getValue(value);
        });
    }

    set charge(charge: number) {
        ffi.chfl_atom_set_charge(this.handle, charge);
    }

    get name(): string {
        return autogrowStrBuffer((ptr, size) => {
            ffi.chfl_atom_name(this.handle, ptr, size, 0);
        });
    }

    set name(name: string) {
        stackAutoclean(() => {
            const value = stackAlloc("char*", name);
            ffi.chfl_atom_set_name(this.handle, value.ptr);
        });
    }

    get type(): string {
        return autogrowStrBuffer((ptr, size) => {
            ffi.chfl_atom_type(this.handle, ptr, size, 0);
        });
    }

    set type(type: string) {
        stackAutoclean(() => {
            const value = stackAlloc("char*", type);
            ffi.chfl_atom_set_type(this.handle, value.ptr);
        });
    }

    get fullName(): string {
        return autogrowStrBuffer((ptr, size) => {
            ffi.chfl_atom_full_name(this.handle, ptr, size, 0);
        });
    }

    get VdWRadius(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            ffi.chfl_atom_vdw_radius(this.handle, value.ptr);
            return getValue(value);
        });
    }

    get covalentRadius(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("double");
            ffi.chfl_atom_covalent_radius(this.handle, value.ptr);
            return getValue(value);
        });
    }

    get atomicNumber(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("uint64_t");
            ffi.chfl_atom_atomic_number(this.handle, value.ptr);
            return getValue(value);
        });
    }
}
