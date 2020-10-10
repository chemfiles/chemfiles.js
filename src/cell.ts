import { CHFL_CELL } from './libchemfiles';
import {
    CHFL_CELL_INFINITE,
    CHFL_CELL_ORTHORHOMBIC,
    CHFL_CELL_TRICLINIC,
    chfl_cellshape,
} from './libchemfiles';
import { lib } from './misc';

import { Pointer } from './c_ptr';

import { getValue, stackAlloc, stackAutoclean } from './stack';
import { Matrix3, Vector3d, check } from './utils';

/** Available cell shapes in Chemfiles */
export enum CellShape {
    /** Shape for unit cells where the three angles are 90° */
    Orthorhombic = CHFL_CELL_ORTHORHOMBIC,
    /** Shape for unit cells where the three angles  may not be 90° */
    Triclinic = CHFL_CELL_TRICLINIC,
    /** Shape for unit cells without periodic boundary conditions */
    Infinite = CHFL_CELL_INFINITE,
}

/**
 * An [[UnitCell]] represent the box containing the atoms, and its periodicity.
 *
 * An unit cell is fully represented by three lengths (a, b, c); and three
 * angles (alpha, beta, gamma). The angles are stored in degrees, and the
 * lengths in Ångströms. The cell angles are defined as follow: alpha is the
 * angles between the cell vectors `b` and `c`; beta as the angle between `a`
 * and `c`; and gamma as the angle between `a` and `b`.
 *
 * A cell also has a matricial representation, by projecting the three base
 * vector into an orthonormal base. We choose to represent such matrix as an
 * upper triangular matrix:
 *
 * ```
 * | a_x   b_x   c_x |
 * |  0    b_y   c_y |
 * |  0     0    c_z |
 * ```
 */
export class UnitCell extends Pointer<CHFL_CELL> {
    /** @hidden
     * Create a new [[UnitCell]] from a raw pointer
     */
    public static __from_ptr(ptr: CHFL_CELL, isConst: boolean): UnitCell {
        const parent = new Pointer(ptr, isConst);
        const cell = Object.create(UnitCell.prototype) as UnitCell;
        Object.assign(cell, parent);
        return cell;
    }

    /**
     * Create a new independent copy of the given `cell`.
     *
     * This function allocate WASM memory, which must be released with
     * [[UnitCell.delete]].
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 22, 12]);
     * const copy = chemfiles.UnitCell.clone(cell);
     *
     * assert.arrayEqual(cell.lengths, [10, 22, 12]);
     * assert.arrayEqual(copy.lengths, [10, 22, 12]);
     *
     * // only cell is modified, not copy
     * cell.lengths = [33, 33, 33];
     * assert.arrayEqual(cell.lengths, [33, 33, 33]);
     * assert.arrayEqual(copy.lengths, [10, 22, 12]);
     *
     * cell.delete();
     * copy.delete();
     * ```
     *
     * @param  cell [[UnitCell]] to copy
     */
    public static clone(cell: UnitCell): UnitCell {
        const ptr = lib._chfl_cell_copy(cell.const_ptr);
        return UnitCell.__from_ptr(ptr, false);
    }

    /**
     * Create a new [[UnitCell]] with given cell `lengths`. If the cell `angles`
     * are given, the cell [[shape|CellShape]] will be `Triclinic`, else it will
     * be `Orthorhombic`.
     *
     * This function allocate WASM memory, which must be released with
     * [[UnitCell.delete]].
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 10, 10]);
     * assert.equal(cell.shape, chemfiles.CellShape.Orthorhombic);
     * assert.arrayEqual(cell.lengths, [10, 10, 10]);
     * assert.arrayEqual(cell.angles, [90, 90, 90]);
     * cell.delete();
     * ```
     * &nbsp;
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 10, 10], [120, 90, 90]);
     * assert.equal(cell.shape, chemfiles.CellShape.Triclinic);
     * assert.arrayEqual(cell.lengths, [10, 10, 10]);
     * assert.arrayEqual(cell.angles, [120, 90, 90]);
     * cell.delete();
     * ```
     *
     * @param lengths lengths of the unit cell vectors, in Ångströms
     * @param angles  angles between the unit cell vectors, in degrees
     */
    constructor(lengths: Vector3d, angles?: Vector3d) {
        const ptr = stackAutoclean(() => {
            if (angles === undefined) {
                const ref = stackAlloc('chfl_vector3d', { initial: lengths });
                return lib._chfl_cell(ref.ptr);
            } else {
                const lengthRef = stackAlloc('chfl_vector3d', { initial: lengths });
                const anglesRef = stackAlloc('chfl_vector3d', { initial: angles });
                return lib._chfl_cell_triclinic(lengthRef.ptr, anglesRef.ptr);
            }
        });
        super(ptr, false);
    }

    /**
     * Get the lengths of this [[UnitCell]] vectors, in Ångströms.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33]);
     * assert.arrayEqual(cell.lengths, [10, 20, 33]);
     * cell.delete();
     * ```
     */
    get lengths(): Vector3d {
        return stackAutoclean(() => {
            const ref = stackAlloc('chfl_vector3d');
            check(lib._chfl_cell_lengths(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    /**
     * Set the lengths of this [[UnitCell]] vectors to the given `value`, in Ångströms.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33]);
     * assert.arrayEqual(cell.lengths, [10, 20, 33]);
     *
     * cell.lengths = [11, 22, 44];
     * assert.arrayEqual(cell.lengths, [11, 22, 44]);
     * cell.delete();
     * ```
     */
    set lengths(value: Vector3d) {
        stackAutoclean(() => {
            const ref = stackAlloc('chfl_vector3d', { initial: value });
            check(lib._chfl_cell_set_lengths(this.ptr, ref.ptr));
        });
    }

    /**
     * Get the angles between this [[UnitCell]] vectors, in degrees.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33], [120, 80, 90]);
     * assert.arrayEqual(cell.angles, [120, 80, 90]);
     * cell.delete();
     * ```
     */
    get angles(): Vector3d {
        return stackAutoclean(() => {
            const ref = stackAlloc('chfl_vector3d');
            check(lib._chfl_cell_angles(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    /**
     * Set the angles between this [[UnitCell]] vectors to the given `value`, in
     * degrees.
     *
     * This is only possible for cell with [[CellShape.Triclinic|triclinic]]
     * shape.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33], [120, 80, 90]);
     * assert.arrayEqual(cell.angles, [120, 80, 90]);
     *
     * cell.angles = [65, 80, 90];
     * assert.arrayEqual(cell.angles, [65, 80, 90]);
     * cell.delete();
     * ```
     */
    set angles(value: Vector3d) {
        stackAutoclean(() => {
            const ref = stackAlloc('chfl_vector3d', { initial: value });
            check(lib._chfl_cell_set_angles(this.ptr, ref.ptr));
        });
    }

    /**
     * Get the [[CellShape|shape]] of this [[UnitCell]].
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33], [120, 80, 90]);
     * assert.equal(cell.shape, chemfiles.CellShape.Triclinic);
     * cell.delete();
     * ```
     */
    get shape(): CellShape {
        return stackAutoclean(() => {
            const ref = stackAlloc('chfl_cellshape');
            check(lib._chfl_cell_shape(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    /**
     * Change the [[CellShape|shape]] of this [[UnitCell]] to the given `value`.
     *
     * Changing from a less restrictive to a more restrictive cell shape is
     * only possible if the corresponding cell angles (`[90, 90, 90]` for
     * Orthorhombic cells) and cell lengths (`[0, 0, 0]` for Infinite cells)
     * are set accordingly beforehand.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33], [90, 90, 90]);
     * assert.equal(cell.shape, chemfiles.CellShape.Triclinic);
     *
     * cell.shape = chemfiles.CellShape.Orthorhombic;
     * assert.equal(cell.shape, chemfiles.CellShape.Orthorhombic);
     * cell.delete();
     * ```
     */
    set shape(value: CellShape) {
        check(lib._chfl_cell_set_shape(this.ptr, value as chfl_cellshape));
    }

    /**
     * Get the volume of this [[UnitCell]], in Ångströms cube.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33]);
     * assert.equal(cell.volume, 10 * 20 * 33);
     * cell.delete();
     * ```
     */
    get volume(): number {
        return stackAutoclean(() => {
            const ref = stackAlloc('double');
            check(lib._chfl_cell_volume(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    /**
     * Get the matricial representation of this [[UnitCell]], i.e. the matrix
     * containing the cell vectors as columns.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33]);
     * assert.arrayEqual(cell.matrix[0], [10,  0, 0], 1e-12);
     * assert.arrayEqual(cell.matrix[1], [ 0, 20, 0], 1e-12);
     * assert.arrayEqual(cell.matrix[2], [ 0,  0, 33], 1e-12);
     * cell.delete();
     * ```
     */
    get matrix(): Matrix3 {
        return stackAutoclean(() => {
            const ref = stackAlloc('chfl_matrix3');
            check(lib._chfl_cell_matrix(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }

    /**
     * Wrap a given vector inside the unit cell, using periodic boundary
     * conditions.
     *
     * ```typescript doctest
     * const cell = new chemfiles.UnitCell([10, 20, 33]);
     * assert.arrayEqual(cell.wrap([27, -24, 15]), [-3, -4, 15]);
     * cell.delete();
     * ```
     *
     * @param  vector vector to be wrapped inside the cell, in Ångströms
     * @return        wrapped vector
     */
    public wrap(vector: Vector3d): Vector3d {
        return stackAutoclean(() => {
            const ref = stackAlloc('chfl_vector3d', { initial: vector });
            check(lib._chfl_cell_wrap(this.const_ptr, ref.ptr));
            return getValue(ref);
        });
    }
}
