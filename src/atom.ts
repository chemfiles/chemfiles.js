import {ffi} from './libchemfiles';
import {str2wasm, ref, autogrowStrBuffer} from './utils';

export class Atom {
    private handle!: ffi.CHFL_ATOM;

    constructor(name: string) {
        const ptr = str2wasm(name);
        const handle = ffi.chfl_atom(ptr);
        ffi.free(ptr);
        return Atom.from_ptr(handle);
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
        const value = ref("double");
        ffi.chfl_atom_mass(this.handle, value.ptr);
        const result = value.get();
        value.free();
        return result;
    }

    set mass(mass: number) {
        ffi.chfl_atom_set_mass(this.handle, mass);
    }

    get charge(): number {
        const value = ref("double");
        ffi.chfl_atom_charge(this.handle, value.ptr);
        const result = value.get();
        value.free();
        return result;
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
        const ptr = str2wasm(name);
        ffi.chfl_atom_set_name(this.handle, ptr);
        ffi.free(ptr);
    }

    get type(): string {
        return autogrowStrBuffer((ptr, size) => {
            ffi.chfl_atom_type(this.handle, ptr, size, 0);
        });
    }

    set type(type: string) {
        const ptr = str2wasm(type);
        ffi.chfl_atom_set_type(this.handle, ptr);
        ffi.free(ptr);
    }

    get fullName(): string {
        return autogrowStrBuffer((ptr, size) => {
            ffi.chfl_atom_full_name(this.handle, ptr, size, 0);
        });
    }

    get VdWRadius(): number {
        const value = ref("double");
        ffi.chfl_atom_vdw_radius(this.handle, value.ptr);
        const result = value.get();
        value.free();
        return result;
    }

    get covalentRadius(): number {
        const value = ref("double");
        ffi.chfl_atom_covalent_radius(this.handle, value.ptr);
        const result = value.get();
        value.free();
        return result;
    }

    get atomicNumber(): number {
        const value = ref("uint64_t");
        ffi.chfl_atom_atomic_number(this.handle, value.ptr);
        const result = value.get();
        value.free();
        return result;
    }
}
