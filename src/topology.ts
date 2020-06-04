import {strict as assert} from 'assert';

import * as lib from './libchemfiles';
import {CHFL_TOPOLOGY, chfl_bond_order} from './libchemfiles';

import {Atom} from './atom';
import {Pointer} from './c_ptr';
import {Residue} from './residue';

import {getValue, stackAlloc, stackAutoclean} from './stack';
import {check, isUnsignedInteger} from './utils';

/**
 * A [[BondOrder]] describe the order of a bond (single, double, etc.).
 *
 * Some possible values are here to support specific file formats, which can
 * store more specific bond types (amide or aromatic for example).
 */
export enum BondOrder {
    /** unspecified bond order */
    Unknown = chfl_bond_order.CHFL_BOND_UNKNOWN,
    /** order for single bonds */
    Single = chfl_bond_order.CHFL_BOND_SINGLE,
    /** order for double bonds */
    Double = chfl_bond_order.CHFL_BOND_DOUBLE,
    /** order for triple bonds */
    Triple = chfl_bond_order.CHFL_BOND_TRIPLE,
    /** order for quadruple bonds (present in some metals) */
    Quadruple = chfl_bond_order.CHFL_BOND_QUADRUPLE,
    /** order for qintuplet bonds (present in some metals) */
    Qintuplet = chfl_bond_order.CHFL_BOND_QINTUPLET,
    /** order for amide bonds */
    Amide = chfl_bond_order.CHFL_BOND_AMIDE,
    /** order for aromatic bonds */
    Aromatic = chfl_bond_order.CHFL_BOND_AROMATIC,
}

/**
 * A [[Topology]] contains the definition of all the atoms in the system,
 * and the liaisons between the atoms (bonds, angles, dihedrals, ...).
 *
 * It will also contain all the [[Residue]] of the system.
 */
export class Topology extends Pointer<CHFL_TOPOLOGY> {
    /** @hidden
     * Create a new Atom from a raw pointer
     */
    public static __from_ptr(ptr: CHFL_TOPOLOGY, isConst: boolean): Topology {
        const parent = new Pointer(ptr, isConst);
        const atom = Object.create(Topology.prototype) as Topology;
        Object.assign(atom, parent);
        return atom;
    }

    /**
     * Create a new independant copy of the given `topology`.
     *
     * This function allocate WASM memory, which must be released with
     * [[Topology.delete]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * const copy = chemfiles.Topology.clone(topology);
     *
     * assert.equal(topology.size, 0);
     * assert.equal(copy.size, 0);
     *
     * // only topology is modified, not copy
     * topology.resize(12);
     * assert.equal(topology.size, 12);
     * assert.equal(copy.size, 0);
     *
     * topology.delete();
     * copy.delete();
     * ```
     * @param  topology [[Topology]] to copy
     */
    public static clone(topology: Topology): Topology {
        const ptr = lib._chfl_topology_copy(topology.const_ptr);
        return Topology.__from_ptr(ptr, false);
    }

    /**
     * Create a new empty [[Topology]].
     *
     * This function allocate WASM memory, which must be released with
     * [[Topology.delete]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.size, 0);
     * topology.delete();
     * ```
     */
    constructor() {
        super(lib._chfl_topology(), false);
    }

    /**
     * Resize this [[Topology]] to contain `size` atoms.
     *
     * If the new number of atoms is bigger than the current number, new atoms
     * will be created with an empty name and type. If it is lower than the
     * current number of atoms, the last atoms will be removed, together with
     * the associated bonds, angles and dihedrals.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.size, 0);
     *
     * topology.resize(12);
     * assert.equal(topology.size, 12);
     *
     * const atom = topology.atom(0);
     * assert.equal(atom.name, '');
     * assert.equal(atom.type, '');
     * atom.delete();
     *
     * topology.delete();
     * ```
     *
     * @param size new size of the topology
     */
    public resize(size: number): void {
        assert(isUnsignedInteger(size), 'size should be a positive integer');
        check(lib._chfl_topology_resize(this.ptr, size, 0));
    }

    /**
     * Add a bond between the atoms at indexes `i` and `j` in this [[Topology]],
     * optionally setting the bond `order`.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(0, 1);
     * topology.addBond(3, 1, chemfiles.BondOrder.Triple);
     *
     * assert.deepEqual(topology.bonds, [[0, 1], [1, 3]]);
     * assert.deepEqual(topology.bondOrders, [chemfiles.BondOrder.Unknown, chemfiles.BondOrder.Triple]);
     *
     * topology.delete();
     * ```
     *
     * @param i     index of the first atom of the bond
     * @param j     index of the second atom of the bond
     * @param order order of the bond
     */
    public addBond(i: number, j: number, order?: BondOrder): void {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');

        if (order === undefined) {
            check(lib._chfl_topology_add_bond(this.ptr, i, 0, j, 0));
        } else {
            check(lib._chfl_topology_bond_with_order(this.ptr, i, 0, j, 0, order as number));
        }
    }

    /**
     * Remove any existing bond between the atoms at indexes `i` and `j` in
     * this [[Topology]].
     *
     * This function does nothing if there is no bond between `i` and `j`.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(0, 1);
     * topology.addBond(3, 1);
     * assert.deepEqual(topology.bonds, [[0, 1], [1, 3]]);
     *
     * topology.removeBond(0, 1);
     * assert.deepEqual(topology.bonds, [[1, 3]]);
     *
     * // does nothing
     * topology.removeBond(0, 2);
     * assert.deepEqual(topology.bonds, [[1, 3]]);
     *
     * topology.delete();
     * ```
     *
     * @param i index of the first atom of the bond
     * @param i index of the second atom of the bond
     */
    public removeBond(i: number, j: number): void {
        assert(isUnsignedInteger(i), 'atom index should be a positive integer');
        assert(isUnsignedInteger(j), 'atom index should be a positive integer');
        check(lib._chfl_topology_remove_bond(this.ptr, i, 0, j, 0));
    }

    /**
     * Get the atom at the given index inside this [[Topology]].
     *
     * This function increase the reference count of this topology, memory will
     * not be released before the atom is itself released with [[Atom.delete]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(3);
     *
     * const atom = topology.atom(2);
     * atom.name = 'C';
     * atom.delete();
     *
     * topology.delete();
     * ```
     *
     * @param  index index of the atom in the topology
     * @return       A modifiable reference to the Atom
     */
    public atom(index: number): Atom {
        assert(isUnsignedInteger(index), 'atom index should be a positive integer');
        const ptr = lib._chfl_atom_from_topology(this.ptr, index, 0);
        return Atom.__from_ptr(ptr, false);
    }

    /**
     * Add a copy of the given `atom` at the end of this [[Topology]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.size, 0);
     *
     * const atom = new chemfiles.Atom('Mg');
     * topology.addAtom(atom);
     * atom.delete();
     *
     * assert.equal(topology.size, 1);
     * topology.delete();
     * ```
     *
     * @param atom atom that will be added to the topology
     */
    public addAtom(atom: Atom): void {
        check(lib._chfl_topology_add_atom(this.ptr, atom.const_ptr));
    }

    /**
     * Remove the [[Atom]] at the given `index` from this [[Topology]].
     *
     * This shifts all the atoms indexes larger than `index` by 1 (`n` becomes
     * `n - 1`).
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.size, 0);
     *
     * let atom = new chemfiles.Atom('Mg');
     * topology.addAtom(atom);
     * atom.delete();
     * atom = new chemfiles.Atom('Na');
     * topology.addAtom(atom);
     * atom.delete();
     * assert.equal(topology.size, 2);
     *
     * topology.remove(0);
     * assert.equal(topology.size, 1);
     * atom = topology.atom(0);
     * assert.equal(atom.name, 'Na');
     * atom.delete();
     *
     * topology.delete();
     * ```
     *
     * @param index [description]
     */
    public remove(index: number): void {
        assert(isUnsignedInteger(index), 'atom index should be a positive integer');
        check(lib._chfl_topology_remove(this.ptr, index, 0));
    }

    /**
     * Get the current number of atoms in this [[Topology]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.size, 0);
     *
     * topology.resize(33);
     * assert.equal(topology.size, 33);
     *
     * topology.delete();
     * ```
     */
    get size(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('uint64_t');
            check(lib._chfl_topology_atoms_count(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get read-only access to the [[Residue]] at the given `index` inside this
     * [[Topology]].
     *
     * The residue index in the topology does not necessarily match the residue
     * id.
     *
     * This function increase the reference count of this topology, memory will
     * not be released before the residue is itself released with
     * [[Residue.delete]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(3);
     *
     * let residue = new chemfiles.Residue('ALA', 3);
     * topology.addResidue(residue);
     * residue.delete();
     *
     * residue = new chemfiles.Residue('GLU');
     * topology.addResidue(residue);
     * residue.delete();
     *
     * residue = topology.residue(0);
     * assert.equal(residue.name, 'ALA');
     * assert.equal(residue.id, 3);
     * residue.delete();
     *
     * topology.delete();
     * ```
     *
     * @param  index index of the residue in the topology
     * @return       A non-modifiable reference to the [[Residue]]
     */
    public residue(index: number): Residue {
        assert(isUnsignedInteger(index), 'residue index should be a positive integer');
        const ptr = lib._chfl_residue_from_topology(this.const_ptr, index, 0);
        return Residue.__from_ptr(ptr, true);
    }

    /**
     * Get read-only access to the residue containing the atom with given
     * `index`, or `undefined` if the atom is not part of a residue.
     *
     * This function increase the reference count of this topology, memory will
     * not be released before the residue is itself released with
     * [[Residue.delete]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(3);
     *
     * let residue = new chemfiles.Residue('PRO');
     * residue.addAtom(0);
     * residue.addAtom(1);
     * topology.addResidue(residue);
     * residue.delete();
     *
     * residue = topology.residueForAtom(1);
     * assert.equal(residue.name, 'PRO');
     * assert.isTrue(residue.contains(0));
     * assert.isTrue(residue.contains(1));
     * residue.delete();
     *
     * residue = topology.residueForAtom(2);
     * assert.equal(residue, undefined);
     *
     * topology.delete();
     * ```
     *
     * @param  index index of the atom in the topology
     * @return       A non-modifiable reference to the [[Residue]]
     */
    public residueForAtom(index: number): Residue | undefined {
        assert(isUnsignedInteger(index), 'atom index should be a positive integer');
        const ptr = lib._chfl_residue_for_atom(this.const_ptr, index, 0);
        if (ptr === 0) {
            return undefined;
        } else {
            return Residue.__from_ptr(ptr, true);
        }
    }

    /**
     * Add the given `residue` at the end of the residue list for this
     * [[Topology]].
     *
     * The residue must contain only atoms that are not already in another
     * residue in this topology, and the [[Residue.id|residue id]] if defined
     * must be different from all other residue id in this topology.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.residuesCount, 0);
     *
     * let residue = new chemfiles.Residue('PRO');
     * topology.addResidue(residue);
     * residue.delete();
     *
     * residue = new chemfiles.Residue('LYS');
     * topology.addResidue(residue);
     * residue.delete();
     *
     * assert.equal(topology.residuesCount, 2);
     * topology.delete();
     * ```
     *
     * @param residue residue to be added to the topology
     */
    public addResidue(residue: Residue): void {
        check(lib._chfl_topology_add_residue(this.ptr, residue.const_ptr));
    }

    /**
     * Check if the two [[Residue]] `first` and `second` from this [[Topology]]
     * are linked together, *i.e.* if there is a bond between one atom in the
     * first residue and one atom in the second one.
     *
     * If the two residues are not part of this topology, the behavior is
     * undefined.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.residuesCount, 0);
     *
     * let residue = new chemfiles.Residue('PRO');
     * topology.addResidue(residue);
     * residue.delete();
     *
     * residue = new chemfiles.Residue('LYS');
     * topology.addResidue(residue);
     * residue.delete();
     *
     * assert.equal(topology.residuesCount, 2);
     * topology.delete();
     * ```
     *
     * @param  first  first residue to test
     * @param  second second residue to test
     * @return        `true` if the two residues are bonded, `false` otherwise
     */
    public residuesLinked(first: Residue, second: Residue): boolean {
        return stackAutoclean(() => {
            const value = stackAlloc('bool');
            check(lib._chfl_topology_residues_linked(
                this.const_ptr, first.const_ptr, second.const_ptr, value.ptr,
            ));
            return getValue(value);
        });
    }

    /**
     * Get the current number of residues in this [[Topology]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * assert.equal(topology.residuesCount, 0);
     *
     * let residue = new chemfiles.Residue('PRO');
     * topology.addResidue(residue);
     * residue.delete();
     *
     * residue = new chemfiles.Residue('LYS');
     * topology.addResidue(residue);
     * residue.delete();
     *
     * assert.equal(topology.residuesCount, 2);
     * topology.delete();
     * ```
     */
    get residuesCount(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('uint64_t');
            check(lib._chfl_topology_residues_count(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the list of all bonds in this [[Topology]].
     *
     * Each bond is represented as a pair of atom indices.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(1, 2);
     * topology.addBond(3, 2);
     * topology.addBond(2, 0);
     *
     * assert.deepEqual(topology.bonds, [[0, 2], [1, 2], [2, 3]]);
     *
     * topology.delete();
     * ```
     */
    get bonds(): Array<[number, number]> {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_topology_bonds_count(this.const_ptr, countRef.ptr));
            const count = getValue(countRef);

            const bonds = stackAlloc('uint64_t[]', {count: 2 * count});
            check(lib._chfl_topology_bonds(this.const_ptr, bonds.ptr, count, 0));
            const linear = getValue(bonds, {count: 2 * count});

            const result = [];
            for (let i = 0; i < count; i++) {
                result.push([linear[2 * i], linear[2 * i + 1]] as [number, number]);
            }
            return result;
        });
    }

    /**
     * Get the list of bond order for all bonds in this [[Topology]]. The values
     * are in the same order as the bonds in [[Topology.bonds]].
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(1, 2, chemfiles.BondOrder.Amide);
     * topology.addBond(2, 3);
     *
     * assert.deepEqual(topology.bondOrders, [
     *     chemfiles.BondOrder.Amide, chemfiles.BondOrder.Unknown
     * ]);
     *
     * topology.delete();
     * ```
     */
    get bondOrders(): BondOrder[] {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_topology_bonds_count(this.const_ptr, countRef.ptr));
            const count = getValue(countRef);

            const orders = stackAlloc('chfl_bond_order[]', {count: count});
            check(lib._chfl_topology_bond_orders(this.const_ptr, orders.ptr, count, 0));
            return getValue(orders, {count: count});
        });
    }

    /**
     * Get the order of the bond between atoms at indexes `i` and `j`.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(1, 2, chemfiles.BondOrder.Amide);
     * topology.addBond(2, 3);
     *
     * assert.equal(topology.bondOrder(2, 1), chemfiles.BondOrder.Amide);
     * assert.equal(topology.bondOrder(2, 3), chemfiles.BondOrder.Unknown);
     *
     * topology.delete();
     * ```
     */
    public bondOrder(i: number, j: number): BondOrder {
        return stackAutoclean(() => {
            const value = stackAlloc('chfl_bond_order');
            check(lib._chfl_topology_bond_order(this.const_ptr, i, 0, j, 0, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the list of all angles in this [[Topology]].
     *
     * Each angle is represented as a triplet of atom indices, with the middle
     * index being the center of the angle.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(1, 2);
     * topology.addBond(2, 3);
     * topology.addBond(2, 0);
     *
     * assert.deepEqual(topology.angles, [[0, 2, 1], [0, 2, 3], [1, 2, 3]]);
     *
     * topology.delete();
     * ```
     */
    get angles(): Array<[number, number, number]> {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_topology_angles_count(this.const_ptr, countRef.ptr));
            const count = getValue(countRef);

            const angles = stackAlloc('uint64_t[]', {count: 3 * count});
            check(lib._chfl_topology_angles(this.const_ptr, angles.ptr, count, 0));
            const linear = getValue(angles, {count: 3 * count});

            const result = [];
            for (let i = 0; i < count; i++) {
                result.push([
                    linear[3 * i], linear[3 * i + 1], linear[3 * i + 2],
                ] as [number, number, number]);
            }
            return result;
        });
    }

    /**
     * Get the list of all dihedral angles in this [[Topology]].
     *
     * Each dihedral angle is represented as a quadruplet of atom indices,
     * with the two middle indexes being the two central atoms of the dihedral
     * angle.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(1, 2);
     * topology.addBond(2, 3);
     * topology.addBond(1, 0);
     *
     * assert.deepEqual(topology.dihedrals, [[0, 1, 2, 3]]);
     *
     * topology.delete();
     * ```
     */
    get dihedrals(): Array<[number, number, number, number]> {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_topology_dihedrals_count(this.const_ptr, countRef.ptr));
            const count = getValue(countRef);

            const dihedrals = stackAlloc('uint64_t[]', {count: 4 * count});
            check(lib._chfl_topology_dihedrals(this.const_ptr, dihedrals.ptr, count, 0));
            const linear = getValue(dihedrals, {count: 4 * count});

            const result = [];
            for (let i = 0; i < count; i++) {
                result.push([
                    linear[4 * i], linear[4 * i + 1], linear[4 * i + 2], linear[4 * i + 3],
                ] as [number, number, number, number]);
            }
            return result;
        });
    }

    /**
     * Get the list of all improper dihedral angles in this [[Topology]].
     *
     * Each improper  dihedral angle is represented as a quadruplet of atom
     * indices, with the second index being the center of the improper dihedral.
     *
     * ```typescript doctest
     * const topology = new chemfiles.Topology();
     * topology.resize(4);
     *
     * topology.addBond(1, 2);
     * topology.addBond(2, 3);
     * topology.addBond(2, 0);
     *
     * assert.deepEqual(topology.impropers, [[0, 2, 1, 3]]);
     *
     * topology.delete();
     * ```
     */
    get impropers(): Array<[number, number, number, number]> {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_topology_impropers_count(this.const_ptr, countRef.ptr));
            const count = getValue(countRef);

            const impropers = stackAlloc('uint64_t[]', {count: 4 * count});
            check(lib._chfl_topology_impropers(this.const_ptr, impropers.ptr, count, 0));
            const linear = getValue(impropers, {count: 4 * count});

            const result = [];
            for (let i = 0; i < count; i++) {
                result.push([
                    linear[4 * i], linear[4 * i + 1], linear[4 * i + 2], linear[4 * i + 3],
                ] as [number, number, number, number]);
            }
            return result;
        });
    }
}
