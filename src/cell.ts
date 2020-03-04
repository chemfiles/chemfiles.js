import * as lib from './libchemfiles';
import {CHFL_CELL, chfl_cellshape} from './libchemfiles';

import {Pointer} from './c_ptr';

import {stackAlloc, stackAutoclean, getValue} from './stack';
import {check, vector3d, matrix3} from './utils';

export enum CellShape {
    Orthorhombic = chfl_cellshape.CHFL_CELL_ORTHORHOMBIC,
    Triclinic = chfl_cellshape.CHFL_CELL_TRICLINIC,
    Infinite = chfl_cellshape.CHFL_CELL_INFINITE,
}

export class UnitCell extends Pointer<CHFL_CELL> {
    constructor(lengths: vector3d, angles?: vector3d) {
        let ptr = stackAutoclean(() => {
            if (angles === undefined) {
                const ref = stackAlloc("chfl_vector3d", lengths);
                return lib._chfl_cell(ref.ptr);
            } else {
                const length_ref = stackAlloc("chfl_vector3d", lengths);
                const angles_ref = stackAlloc("chfl_vector3d", angles);
                return lib._chfl_cell_triclinic(length_ref.ptr, angles_ref.ptr);
            }
        });
        super(ptr, false);
    }

    get lengths(): vector3d {
        return stackAutoclean(() => {
            const ref = stackAlloc("chfl_vector3d");
            check(lib._chfl_cell_lengths(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    set lengths(value: vector3d) {
        stackAutoclean(() => {
            const ref = stackAlloc("chfl_vector3d", value);
            check(lib._chfl_cell_set_lengths(this.ptr, ref.ptr));
        });
    }

    get angles(): vector3d {
        return stackAutoclean(() => {
            const ref = stackAlloc("chfl_vector3d");
            check(lib._chfl_cell_angles(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    set angles(value: vector3d) {
        stackAutoclean(() => {
            const ref = stackAlloc("chfl_vector3d", value);
            check(lib._chfl_cell_set_angles(this.ptr, ref.ptr));
        });
    }

    get shape(): CellShape {
        return stackAutoclean(() => {
            const ref = stackAlloc("chfl_cellshape");
            check(lib._chfl_cell_shape(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    set shape(value: CellShape) {
        check(lib._chfl_cell_set_shape(this.ptr, value));
    }

    get volume(): number {
        return stackAutoclean(() => {
            const ref = stackAlloc("double");
            check(lib._chfl_cell_volume(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    wrap(vector: vector3d): vector3d {
        return stackAutoclean(() => {
            const ref = stackAlloc("chfl_vector3d", vector);
            check(lib._chfl_cell_wrap(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    get matrix(): matrix3 {
        return stackAutoclean(() => {
            const ref = stackAlloc("chfl_matrix3");
            check(lib._chfl_cell_matrix(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    static clone(other: UnitCell): UnitCell {
        const ptr = lib._chfl_cell_copy(other.const_ptr);
        return UnitCell.__from_ptr(ptr);
    }

    /** @internal
     * Create a new UnitCell from a raw pointer
     */
    static __from_ptr(ptr: CHFL_CELL): UnitCell {
        const parent = new Pointer(ptr, true);
        const atom = Object.create(UnitCell.prototype);
        Object.assign(atom, parent);
        return atom;
    }
}
