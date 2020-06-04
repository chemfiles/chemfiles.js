import {strict as assert} from 'assert';

import * as sizes from '../lib/wasm-sizes';
import * as lib from './libchemfiles';
import {CHFL_FRAME, chfl_vector3d} from './libchemfiles';

import {Atom} from './atom';
import {Pointer} from './c_ptr';
import {UnitCell} from './cell';
import {Residue} from './residue';
import {BondOrder, Topology} from './topology';

import {PropertyType, createProperty, getProperty} from './property';
import {getValue, stackAlloc, stackAutoclean} from './stack';
import {Vector3d, check, isUnsignedInteger} from './utils';

/**
 * An Array of Vector3d allowing direct access into WASM memory. It can be
 * indexed and iterated over.
 *
 * ```typescript doctest
 * # const frame = new chemfiles.Frame();
 * # frame.resize(33);
 * # frame.positions[3] = [2, -3, 8]
 * // get an array from a Frame
 * const positions = frame.positions;
 * assert.equal(positions.length, frame.size);
 *
 * // indexing and access to individual elements
 * assert.arrayEqual(positions[2], [0, 0, 0]);
 * assert.arrayEqual(positions[3], [2, -3, 8]);
 *
 * // direct modification of WASM memory
 * positions[2] = [2, 2, 2];
 * assert.arrayEqual(positions[2], [2, 2, 2]);
 *
 * // iteration over all the values
 * let total = 0;
 * for (const pos of positions) {
 *     total += pos[0];
 * }
 * assert.equal(total, 4);
 * ```
 */
export interface Array3D {
    readonly length: number;
    /** @hidden */
    [i: number]: Vector3d;
    /** @hidden */
    [Symbol.iterator](): Generator<Vector3d, void, void>;
}

/**
 * Create an object obeying the Array3D interface using data from the given
 * pointer and length.
 */
function createArray3D(ptr: chfl_vector3d, length: number): Array3D {
    const start = ptr / sizes.SIZEOF_DOUBLE;
    const buffer = lib.HEAPF64.subarray(start, start + 3 * length);
    const iterator = function*() {
        for (let i = 0; i < length; i++) {
            yield buffer.subarray(3 * i, 3 * i + 3);
        }
    };

    const object = {
        __buffer: buffer,
        length: length,
        [Symbol.iterator]: iterator,
    };

    return new Proxy(object, {
        get: (self: typeof object, key: string | number) => {
            if (key in self) {
                return self[key as keyof typeof object];
            } else {
                const i = Number(key);
                if (!isUnsignedInteger(i)) {
                    return undefined;
                } else {
                    return self.__buffer.subarray(3 * i, 3 * i + 3);
                }
            }
        },
        set: (self: typeof object, key: string | number, value: ArrayLike<number>) => {
            const i = Number(key);
            if (!isUnsignedInteger(i) || value.length !== 3) {
                return false;
            } else {
                self.__buffer.set(value, 3 * i);
                return true;
            }
        },
    }) as Array3D;
}

/**
 * A [[Frame]] contains data from one simulation step: the current [[UnitCell]],
 * the [[Topology]], the positions, and the velocities of the particles in the
 * system. If some information is missing (topology or velocity or unit
 * cell), the corresponding data is filled with a default value.
 */
export class Frame extends Pointer<CHFL_FRAME> {
    /**
     * Create a new independant copy of the given `frame`.
     *
     * This function allocate WASM memory, which must be released with
     * [[Frame.delete]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * const copy = chemfiles.Frame.clone(frame);
     *
     * assert.equal(frame.size, 0);
     * assert.equal(copy.size, 0);
     *
     * // only frame is modified, not copy
     * frame.resize(12);
     * assert.equal(frame.size, 12);
     * assert.equal(copy.size, 0);
     *
     * frame.delete();
     * copy.delete();
     * ```
     * @param  frame [[Frame]] to copy
     */
    public static clone(frame: Frame): Frame {
        const ptr = lib._chfl_frame_copy(frame.const_ptr);
        const parent = new Pointer(ptr, false);
        const copy = Object.create(Frame.prototype) as Frame;
        Object.assign(copy, parent);
        return copy;
    }

    /**
     * Create a new empty [[Frame]].
     *
     * This function allocate WASM memory, which must be released with
     * [[Frame.delete]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * assert.equal(frame.size, 0);
     * frame.delete();
     * ```
     */
    constructor() {
        const ptr = lib._chfl_frame();
        super(ptr, false);
    }

    /**
     * Get the step of this [[Frame]], i.e. the frame number in the trajectory.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * assert.equal(frame.step, 0);
     * frame.delete();
     * ```
     */
    get step(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('uint64_t');
            check(lib._chfl_frame_step(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Set the step of this [[Frame]] to the given `value`.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.step = 42
     * assert.equal(frame.step, 42);
     * frame.delete();
     * ```
     * @param  value new value for this frame step
     */
    set step(value: number) {
        assert(isUnsignedInteger(value), 'step value should be a positive integer');
        check(lib._chfl_frame_set_step(this.ptr, value, 0));
    }

    /**
     * Get a modifiable reference to the [[UnitCell]] of this [[Frame]].
     *
     * This function increase the reference count of this frame, memory will not
     * be released before the cell is itself released with [[UnitCell.delete]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * let cell = frame.cell();
     * assert.arrayEqual(cell.lengths, [0, 0, 0]);
     *
     * cell.shape = chemfiles.CellShape.Orthorhombic;
     * cell.lengths = [10, 10, 12];
     * cell.delete()
     *
     * cell = frame.cell();
     * assert.arrayEqual(cell.lengths, [10, 10, 12]);
     * cell.delete()
     *
     * frame.delete();
     * ```
     */
    public cell(): UnitCell {
        const ptr = lib._chfl_cell_from_frame(this.ptr);
        return UnitCell.__from_ptr(ptr, false);
    }

    /**
     * Set the [[UnitCell]] of this [[Frame]] to a copy of the given `cell`.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * let cell = new chemfiles.UnitCell([12, 12, 15]);
     * frame.setCell(cell);
     * cell.delete();
     *
     * cell = frame.cell();
     * assert.arrayEqual(cell.lengths, [12, 12, 15]);
     * cell.delete()
     *
     * frame.delete();
     * ```
     * @param cell new cell for this frame
     */
    public setCell(cell: UnitCell): void {
        check(lib._chfl_frame_set_cell(this.ptr, cell.const_ptr));
    }

    /**
     * Get read and write access to the positions of all atoms in this [[Frame]].
     *
     * If the frame is resized (by writing to it, calling [[Frame.resize]]
     * [[Frame.addAtom]] or [[Frame.remove]]), the array is invalidated, and
     * accessing it can produce random results, even in unrelated parts of the
     * code
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * const atom = new chemfiles.Atom('');
     * frame.addAtom(atom, [1, 2, 3]);
     * frame.addAtom(atom, [-1, 2, 3]);
     * frame.addAtom(atom, [1, -2, 3]);
     * frame.addAtom(atom, [1, 2, -3]);
     * atom.delete();
     *
     * const positions = frame.positions;
     * assert.equal(positions.length, 4);
     * assert.equal(positions[0].length, 3);
     *
     * // get the positions
     * assert.arrayEqual(positions[0], [1, 2, 3]);
     *
     * // set new values for the positions
     * positions[0] = [3, 4.2, -3];
     *
     * frame.delete();
     * ```
     * @return an array-like object for accessing positions
     */
    get positions(): Array3D {
        return stackAutoclean(() => {
            const size = stackAlloc('uint64_t');
            const positions = lib.stackAlloc(sizes.SIZEOF_VOID_P) as chfl_vector3d;
            check(lib._chfl_frame_positions(this.ptr, positions, size.ptr));

            const ptr = lib.getValue(positions, '*') as chfl_vector3d;
            const length = getValue(size);
            return createArray3D(ptr, length);
        });
    }

    /**
     * Get read and write access to the velocities of all atoms in this
     * [[Frame]].
     *
     * Velocities might not be present in the frame, in which case this function
     * returns `undefined`. You can add velocities to a frame with
     * [[Frame.addVelocities]].
     *
     * If the frame is resized (by writing to it, calling [[Frame.resize]]
     * [[Frame.addAtom]] or [[Frame.remove]]), the array is invalidated, and
     * accessing it can produce random results, even in unrelated parts of the
     * code.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.addVelocities();
     *
     * const atom = new chemfiles.Atom('');
     * frame.addAtom(atom, [1, 2, 3]);
     * frame.addAtom(atom, [-1, 2, 3], [4, 5, 6]);
     * frame.addAtom(atom, [1, -2, 3], [4, -5, 6]);
     * frame.addAtom(atom, [1, 2, -3]);
     * atom.delete();
     *
     * const velocities = frame.velocities;
     * assert.notEqual(velocities, undefined);
     * assert.equal(velocities.length, 4);
     * assert.equal(velocities[0].length, 3);
     *
     * // get the velocities
     * assert.arrayEqual(velocities[0], [0, 0, 0]);
     * assert.arrayEqual(velocities[1], [4, 5, 6]);
     *
     * // set new values for the velocities
     * velocities[0] = [3, 4.2, -3];
     *
     * frame.delete();
     * ```
     * @return an array-like object for accessing velocities
     */
    get velocities(): Array3D | undefined {
        return stackAutoclean(() => {
            const hasVelocities = stackAlloc('bool');
            check(lib._chfl_frame_has_velocities(this.const_ptr, hasVelocities.ptr));
            if (!getValue(hasVelocities)) {
                return undefined;
            }

            const size = stackAlloc('uint64_t');
            const positions = lib.stackAlloc(sizes.SIZEOF_VOID_P) as chfl_vector3d;
            check(lib._chfl_frame_velocities(this.ptr, positions, size.ptr));

            const ptr = lib.getValue(positions, '*') as chfl_vector3d;
            const length = getValue(size);
            return createArray3D(ptr, length);
        });
    }

    /**
     * Add velocity data to this [[Frame]].
     *
     * The velocities are initialized to zero. If the frame already contains
     * velocities, this function does nothing.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * assert.equal(frame.velocities, undefined);
     * frame.addVelocities()
     *
     * assert.notEqual(frame.velocities, undefined);
     * frame.delete();
     * ```
     */
    public addVelocities(): void {
        check(lib._chfl_frame_add_velocities(this.ptr));
    }

    /**
     * Get the number of atoms in this [[Frame]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * assert.equal(frame.size, 0);
     *
     * frame.resize(42);
     * assert.equal(frame.size, 42);
     * frame.delete();
     * ```
     */
    get size(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('uint64_t');
            check(lib._chfl_frame_atoms_count(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the atom at the given index inside this [[Frame]].
     *
     * This function increase the reference count of this frame, memory will
     * not be released before the atom is itself released with [[Atom.delete]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.resize(3);
     *
     * const atom = frame.atom(2);
     * atom.name = 'C';
     * atom.delete();
     *
     * frame.delete();
     * ```
     * @param  index index of the atom in the frame
     * @return       A modifiable reference to the Atom
     */
    public atom(index: number): Atom {
        assert(isUnsignedInteger(index), 'atom index should be a positive integer');
        const ptr = lib._chfl_atom_from_frame(this.ptr, index, 0);
        return Atom.__from_ptr(ptr, false);
    }

    /**
     * Add a copy of the given `atom` at the corresponding `position` and
     * `velocity` to this [[Frame]].
     *
     * If `velocity` is `undefined` and the frame contains velocities, the
     * atom velocity will be set to 0.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * // create a vibrating CO2 molecule
     * const O = new chemfiles.Atom('O');
     * const C = new chemfiles.Atom('C');
     * frame.addAtom(O, [-1.2, 0, 0], [-0.1, 0.0, 0.1]);
     * frame.addAtom(C, [0, 0, 0],    [0.1, 0.0, -0.1]);
     * frame.addAtom(O, [1.2, 0, 0],  [-0.1, 0.0, 0.1]);
     * O.delete();
     * C.delete();
     *
     * frame.delete();
     * ```
     *
     * @param atom       new atom to add to this frame [[Topology]]
     * @param position   position of the atom, in Ångströms
     * @param velocities velocity of the atom, in Å/fs
     */
    public addAtom(atom: Atom, position: Vector3d, velocities?: Vector3d): void {
        return stackAutoclean(() => {
            const pos = stackAlloc('chfl_vector3d', {initial: position});
            if (velocities === undefined) {
                check(lib._chfl_frame_add_atom(this.ptr, atom.const_ptr, pos.ptr, 0 as chfl_vector3d));
            } else {
                const vel = stackAlloc('chfl_vector3d', {initial: velocities});
                check(lib._chfl_frame_add_atom(this.ptr, atom.const_ptr, pos.ptr, vel.ptr));
            }
        });
    }

    /**
     * Remove the atom at the given `index` in this [[Frame]].
     *
     * This shifts all the atoms indexes larger than `index` by 1 (`n` becomes
     * `n - 1`); and invalidate any array obtained using [[Frame.positions]] or
     * [[Frame.velocities]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * assert.equal(frame.size, 0);
     *
     * let atom = new chemfiles.Atom('Mg');
     * frame.addAtom(atom);
     * atom.delete();
     *
     * atom = new chemfiles.Atom('Na');
     * frame.addAtom(atom);
     * atom.delete();
     * assert.equal(frame.size, 2);
     *
     * frame.remove(0);
     * assert.equal(frame.size, 1);
     * atom = frame.atom(0);
     * assert.equal(atom.name, 'Na');
     * atom.delete();
     *
     * frame.delete();
     * ```
     * @param index index of the atom to remove
     */
    public remove(index: number): void {
        assert(isUnsignedInteger(index), 'atom index should be a positive integer');
        check(lib._chfl_frame_remove(this.ptr, index, 0));
    }

    /**
     * Resize the positions, velocities and topology in this [[Frame]] to have
     * space for `size` atoms.
     *
     * This function may invalidate any array of the positions or the
     * velocities if the new size is bigger than the old one. In all cases,
     * previous data is conserved. This function conserve the presence or
     * absence of velocities.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * assert.equal(frame.size, 0);
     *
     * frame.resize(12);
     * assert.equal(frame.size, 12);
     *
     * const atom = frame.atom(0);
     * assert.equal(atom.name, '');
     * assert.equal(atom.type, '');
     * atom.delete();
     *
     * frame.delete();
     * ```
     * @param size the new size of the frame
     */
    public resize(size: number): void {
        assert(isUnsignedInteger(size), 'size should be a positive integer');
        check(lib._chfl_frame_resize(this.ptr, size, 0));
    }

    /**
     * Get a **read-only** reference to the [[Topology]] of this [[Frame]].
     *
     * This function increase the reference count of this frame, memory will not
     * be released before the topology is itself released with
     * [[Topology.delete]].
     *
     * Changes to the topology are possible through [[Frame.addBond]],
     * [[Frame.removeBond]] and [[Frame.addResidue]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.resize(4);
     * frame.addBond(0, 1);
     * frame.addBond(0, 3);
     *
     * const topology = frame.topology();
     * assert.deepEqual(topology.bonds, [[0, 1], [0, 3]]);
     * assert.deepEqual(topology.angles, [[1, 0, 3]]);
     *
     * topology.delete();
     * frame.delete();
     * ```
     */
    public topology(): Topology {
        const ptr = lib._chfl_topology_from_frame(this.ptr);
        return Topology.__from_ptr(ptr, true);
    }

    /**
     * Set the [[Topology]] of this [[Frame]] to a copy of the given [[Topology]].
     *
     * The topology size must match the frame size.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.resize(4);
     *
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     * topology.addBond(0, 1);
     * topology.addBond(0, 3);
     *
     * frame.setTopology(topology);
     *
     * topology.delete();
     * frame.delete();
     * ```
     * @param topology the new topology of the frame
     */
    public setTopology(topology: Topology): void {
        check(lib._chfl_frame_set_topology(this.ptr, topology.const_ptr));
    }

    /**
     * Guess the bonds, angles and dihedrals in this [[Frame]].
     *
     * The bonds are guessed using a distance-based algorithm, and then angles
     * and dihedrals are guessed from the bonds. The distance criterion uses
     * the Van der Waals radii of the atoms. If this information is missing
     * for a specific atoms, one can use [[addConfiguration|configuration]]
     * files to provide it.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * const atom = new chemfiles.Atom('C');
     * frame.addAtom(atom, [0, 0, 0]);
     * frame.addAtom(atom, [1.5, 0, 0]);
     * frame.addAtom(atom, [0, 1.5, 0]);
     * atom.delete();
     *
     * frame.guessBonds();
     * const topology = frame.topology();
     * assert.deepEqual(topology.bonds, [[0, 1], [0, 2]]);
     * assert.deepEqual(topology.angles, [[1, 0, 2]]);
     * topology.delete();
     *
     * frame.delete();
     * ```
     */
    public guessBonds(): void {
        check(lib._chfl_frame_guess_bonds(this.ptr));
    }

    /**
     * Add a bond between the atoms at indexes `i` and `j` in this [[Frame]],
     * optionally setting the bond `order`.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.resize(4);
     *
     * frame.addBond(0, 1);
     * frame.addBond(3, 1, chemfiles.BondOrder.Triple);
     *
     * const topology = frame.topology();
     * assert.deepEqual(topology.bonds, [[0, 1], [1, 3]]);
     * assert.deepEqual(topology.bondOrders, [chemfiles.BondOrder.Unknown, chemfiles.BondOrder.Triple]);
     * topology.delete();
     *
     * frame.delete();
     * ```
     * @param i     index of the first atom of the bond
     * @param j     index of the second atom of the bond
     * @param order order of the bond
     */
    public addBond(i: number, j: number, order?: BondOrder): void {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');
        if (order === undefined) {
            check(lib._chfl_frame_add_bond(this.ptr, i, 0, j, 0));
        } else {
            check(lib._chfl_frame_bond_with_order(this.ptr, i, 0, j, 0, order as number));
        }
    }

    /**
     * Remove any existing bond between the atoms at indexes `i` and `j` in
     * this [[Frame]].
     *
     * This function does nothing if there is no bond between `i` and `j`.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.resize(4);
     *
     * frame.addBond(0, 1);
     * frame.addBond(3, 1);
     *
     * let topology = frame.topology();
     * assert.deepEqual(topology.bonds, [[0, 1], [1, 3]]);
     * topology.delete();
     *
     * frame.removeBond(0, 1);
     *
     * topology = frame.topology();
     * assert.deepEqual(topology.bonds, [[1, 3]]);
     * topology.delete();
     *
     * frame.delete();
     * ```
     *
     * @param i index of the first atom of the bond
     * @param i index of the second atom of the bond
     */
    public removeBond(i: number, j: number): void {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');
        check(lib._chfl_frame_remove_bond(this.ptr, i, 0, j, 0));
    }

    /**
     * Add the given `residue` at the end of the residue list of this frame's
     * [[Topology]].
     *
     * The residue must contain only atoms that are not already in another
     * residue in the topology, and the [[Residue.id|residue id]] if defined
     * must be different from all other residue id in the topology.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * let topology = frame.topology();
     * assert.equal(topology.residuesCount, 0);
     * topology.delete();
     *
     * let residue = new chemfiles.Residue('PRO');
     * frame.addResidue(residue);
     * residue.delete();
     *
     * residue = new chemfiles.Residue('LYS');
     * frame.addResidue(residue);
     * residue.delete();
     *
     * topology = frame.topology();
     * assert.equal(topology.residuesCount, 2);
     * topology.delete();
     *
     * frame.delete();
     * ```
     *
     * @param residue residue to be added to this frame's topology
     */
    public addResidue(residue: Residue): void {
        check(lib._chfl_frame_add_residue(this.ptr, residue.const_ptr));
    }
    /**
     * Get the distance (in Ångströms) between the atoms at indexes `i` and
     * `j` in this [[Frame]], taking periodic boundary conditions into account.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * const atom = new chemfiles.Atom('');
     * frame.addAtom(atom, [0, 0, 0]);
     * frame.addAtom(atom, [1, 2, 3]);
     * atom.delete();
     *
     * assert.approximately(frame.distance(0, 1), Math.sqrt(14), 1e-15);
     *
     * frame.delete();
     * ```
     *
     * @param  i index of the first atom in the pair
     * @param  j index of the second atom in the pair
     * @return   the distance between atoms `i` and `j`
     */
    public distance(i: number, j: number): number {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_frame_distance(this.ptr, i, 0, j, 0, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the angle (in radians) formed by the atoms at indexes `i`, `j` and
     * `k` in this [[Frame]], taking periodic boundary conditions into account.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * const atom = new chemfiles.Atom('');
     * frame.addAtom(atom, [1, 0, 0]);
     * frame.addAtom(atom, [0, 0, 0]);
     * frame.addAtom(atom, [0, 1, 0]);
     * atom.delete();
     *
     * assert.approximately(frame.angle(0, 1, 2), Math.PI / 2, 1e-12);
     *
     * frame.delete();
     * ```
     *
     * @param  i index of the first atom in the angle
     * @param  j index of the second atom in the angle
     * @param  k index of the third atom in the angle
     * @return   the angle defined by `i`, `j`, and `k`
     */
    public angle(i: number, j: number, k: number): number {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');
        assert(isUnsignedInteger(k), 'atom index should be a positive integer');
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_frame_angle(this.ptr, i, 0, j, 0, k, 0, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the dihedral angle (in radians) formed by the atoms at indexes `i`,
     * `j`, `k` and `m` in this [[Frame]], taking periodic boundary conditions
     * into account.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * const atom = new chemfiles.Atom('');
     * frame.addAtom(atom, [1, 0, 0]);
     * frame.addAtom(atom, [0, 0, 0]);
     * frame.addAtom(atom, [0, 1, 0]);
     * frame.addAtom(atom, [0, 1, 1]);
     * atom.delete();
     *
     * assert.approximately(frame.dihedral(0, 1, 2, 3), Math.PI / 2, 1e-12);
     *
     * frame.delete();
     * ```
     *
     * @param  i index of the first atom in the dihedral
     * @param  j index of the second atom in the dihedral
     * @param  k index of the third atom in the dihedral
     * @param  m index of the fourth atom in the dihedral
     * @return   the dihedral angle defined by `i`, `j`, `k`, and `m`
     */
    public dihedral(i: number, j: number, k: number, m: number): number {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');
        assert(isUnsignedInteger(k), 'atom index should be a positive integer');
        assert(isUnsignedInteger(m), 'atom index should be a positive integer');
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_frame_dihedral(this.ptr, i, 0, j, 0, k, 0, m, 0, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the out of plane distance (in Ångströms) formed by the atoms at
     * indexes `i`, `j`, `k` and `m` in this [[Frame]], taking periodic
     * boundary conditions into account.
     *
     * This is the distance betweent the atom j and the ikm plane. The j atom
     * is the center of the improper dihedral angle formed by i, j, k and m.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * const atom = new chemfiles.Atom('');
     * frame.addAtom(atom, [0, 0, 0]);
     * frame.addAtom(atom, [0, 0, 2]);
     * frame.addAtom(atom, [1, 0, 0]);
     * frame.addAtom(atom, [0, 1, 0]);
     * atom.delete();
     *
     * assert.approximately(frame.outOfPlane(0, 1, 2, 3), 2, 1e-12);
     *
     * frame.delete();
     * ```
     *
     * @param  i index of the first atom in the improper dihedral
     * @param  j index of the second atom in the improper dihedral
     * @param  k index of the third atom in the improper dihedral
     * @param  m index of the fourth atom in the improper dihedral
     * @return   the out of plane distance defined by `i`, `j`, `k`, and `m`
     */
    public outOfPlane(i: number, j: number, k: number, m: number): number {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');
        assert(isUnsignedInteger(k), 'atom index should be a positive integer');
        assert(isUnsignedInteger(m), 'atom index should be a positive integer');
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_frame_out_of_plane(this.ptr, i, 0, j, 0, k, 0, m, 0, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the property of this frame with the given `name`, or undefined
     * if the property does not exists.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * frame.set('number', 3);
     * assert.equal(frame.get('number'), 3);
     * assert.equal(frame.get('not existing'), undefined);
     *
     * frame.delete();
     * ```
     *
     * @param  name name of the property
     * @return      value of the property if it exists
     */
    public get(name: string): PropertyType | undefined {
        return stackAutoclean(() => {
            const value = stackAlloc('char*', {initial: name});
            const property = lib._chfl_frame_get_property(this.const_ptr, value.ptr);
            if (property === 0) {
                return undefined;
            } else {
                const result = getProperty(property);
                lib._chfl_free(property);
                return result;
            }
        });
    }

    /**
     * Set a property of this frame, with the given `name` and `value`.
     *
     * The new value overwrite any pre-existing property with the same name.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     *
     * // number property
     * frame.set('number', 3);
     *
     * // string property
     * frame.set('string', 'val');
     *
     * // boolean property
     * frame.set('bool', false);
     *
     * // Vector3d property
     * frame.set('vector', [3, 4, -2]);
     * frame.delete();
     * ```
     *
     * @param name  name of the new property
     * @param value value of the new property
     */
    public set(name: string, value: PropertyType): void {
        return stackAutoclean(() => {
            const property = createProperty(value);
            const wasmName = stackAlloc('char*', {initial: name});
            check(lib._chfl_frame_set_property(this.ptr, wasmName.ptr, property));
            lib._chfl_free(property);
        });
    }

    /**
     * Get the name of all properties set on this [[Frame]].
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * frame.set('number', 3);
     * frame.set('string', 'val');
     *
     * assert.deepEqual(frame.properties(), ['string', 'number'])
     * frame.delete();
     * ```
     *
     * @return array containing the name of all properties
     */
    public properties(): string[] {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_frame_properties_count(this.ptr, countRef.ptr));
            const count = getValue(countRef);

            const names = stackAlloc('char*[]', {count});
            check(lib._chfl_frame_list_properties(this.ptr, names.ptr, count, 0));
            return getValue(names, {count});
        });
    }
}
