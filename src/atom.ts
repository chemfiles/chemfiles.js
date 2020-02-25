import {ffi} from './libchemfiles';
import {str2wasm, ref} from './utils';

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
}
