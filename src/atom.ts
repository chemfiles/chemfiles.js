import { CHFL_ATOM } from './libchemfiles';
import { lib } from './misc';

import { Pointer } from './c_ptr';

import { PropertyType, createProperty, getProperty } from './property';
import { getValue, stackAlloc, stackAutoclean } from './stack';
import { autogrowStrBuffer, check } from './utils';

/**
 * An [[Atom]] is a particle in the current [[Frame]]. It stores the following
 * atomic properties:
 * - atom name;
 * - atom type;
 * - atom mass;
 * - atom charge.
 *
 * The atom name is usually an unique identifier (``'H1'``, ``'C_a'``) while
 * the atom type will be shared between all particles of the same type:
 * ``'H'``, ``'Ow'``, ``'CH3'``.
 */
export class Atom extends Pointer<CHFL_ATOM> {
    /** @hidden
     * Create a new [[Atom]] from a raw pointer
     */
    public static __from_ptr(ptr: CHFL_ATOM, isConst: boolean): Atom {
        const parent = new Pointer(ptr, isConst);
        const atom = Object.create(Atom.prototype) as Atom;
        Object.assign(atom, parent);
        return atom;
    }

    /**
     * Create a new independent copy of the given `atom`.
     *
     * This function allocate WASM memory, which must be released with
     * [[Atom.delete]].
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * const copy = chemfiles.Atom.clone(atom);
     *
     * assert.equal(atom.name, 'C');
     * assert.equal(copy.name, 'C');
     *
     * // only atom is modified, not copy
     * atom.name = 'O';
     * assert.equal(atom.name, 'O');
     * assert.equal(copy.name, 'C');
     *
     * atom.delete();
     * copy.delete();
     * ```
     *
     * @param  atom [[Atom]] to copy
     */
    public static clone(atom: Atom): Atom {
        const ptr = lib._chfl_atom_copy(atom.const_ptr);
        return Atom.__from_ptr(ptr, false);
    }

    /**
     * Create a new [[Atom]] with the given `name`. If `type` is given, use
     * it as the atom type. Else the atom name is used as atom type.
     *
     * This function allocate WASM memory, which must be released with
     * [[Atom.delete]].
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('Fe');
     * assert.equal(atom.name, 'Fe');
     * assert.equal(atom.type, 'Fe');
     * atom.delete();
     * ```
     * &nbsp;
     * ```typescript doctest
     * const atom = new chemfiles.Atom('Fe-3', 'Fe');
     * assert.equal(atom.name, 'Fe-3');
     * assert.equal(atom.type, 'Fe');
     * atom.delete();
     * ```
     *
     * @param name name of the new Atom
     * @param type atomic type of the new Atom
     */
    constructor(name: string, type?: string) {
        const ptr = stackAutoclean(() => {
            const value = stackAlloc('char*', { initial: name });
            return lib._chfl_atom(value.ptr);
        });
        super(ptr, false);

        if (type !== undefined) {
            this.type = type;
        }
    }

    /**
     * Get the mass of this [[Atom]], in atomic mass units.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.mass, 12.011);
     * atom.delete();
     * ```
     */
    get mass(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_atom_mass(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Set the mass of this [[Atom]], in atomic mass units.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.mass, 12.011);
     *
     * atom.mass = 14.0
     * assert.equal(atom.mass, 14.0);
     * atom.delete();
     * ```
     *
     * @param  mass new mass for the atom
     */
    set mass(mass: number) {
        check(lib._chfl_atom_set_mass(this.ptr, mass));
    }

    /**
     * Get the charge of this [[Atom]], in number of the electron charge *e*.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.charge, 0);
     * atom.delete();
     * ```
     */
    get charge(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_atom_charge(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Set the charge of this [[Atom]], in number of the electron charge *e*.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.charge, 0);
     *
     * atom.charge = 1.2;
     * assert.equal(atom.charge, 1.2);
     * atom.delete();
     * ```
     *
     * @param  charge new charge for the atom
     */
    set charge(charge: number) {
        check(lib._chfl_atom_set_charge(this.ptr, charge));
    }

    /**
     * Get the name of this [[Atom]]
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.name, 'C');
     * atom.delete();
     * ```
     */
    get name(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_atom_name(this.const_ptr, ptr, size, 0));
        });
    }

    /**
     * Set the name of this [[Atom]]
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.name, 'C');
     *
     * atom.name = 'O';
     * assert.equal(atom.name, 'O');
     * atom.delete();
     * ```
     *
     * @param  name new name for the atom
     */
    set name(name: string) {
        stackAutoclean(() => {
            const value = stackAlloc('char*', { initial: name });
            check(lib._chfl_atom_set_name(this.ptr, value.ptr));
        });
    }

    /**
     * Get the type of this [[Atom]]
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C1', 'C');
     * assert.equal(atom.type, 'C');
     * atom.delete();
     * ```
     */
    get type(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_atom_type(this.const_ptr, ptr, size, 0));
        });
    }

    /**
     * Set the type of this [[Atom]]
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C1', 'C');
     * assert.equal(atom.type, 'C');
     *
     * atom.type = 'O';
     * assert.equal(atom.type, 'O');
     * atom.delete();
     * ```
     *
     * @param  type new atomic type for this atom
     */
    set type(type: string) {
        stackAutoclean(() => {
            const value = stackAlloc('char*', { initial: type });
            check(lib._chfl_atom_set_type(this.ptr, value.ptr));
        });
    }

    /**
     * Full name of this [[Atom]], as guessed from the type.
     *
     * For example, the full name associated with `type = 'He'` is `'Helium'`.
     * If no name can be found, the full name will be an empty string.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.fullName, 'Carbon');
     * atom.delete();
     * ```
     * &nbsp;
     * ```typescript doctest
     * const atom = new chemfiles.Atom('CH4');
     * assert.equal(atom.fullName, '');
     * atom.delete();
     * ```
     */
    get fullName(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_atom_full_name(this.const_ptr, ptr, size, 0));
        });
    }

    /**
     * Van der Walls radius of this [[Atom]], as guessed from the type.
     *
     * If no radius can be found, the radius will be 0.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.VdWRadius, 1.7);
     * atom.delete();
     * ```
     * &nbsp;
     * ```typescript doctest
     * const atom = new chemfiles.Atom('CH4');
     * assert.equal(atom.VdWRadius, 0);
     * atom.delete();
     * ```
     */
    get VdWRadius(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_atom_vdw_radius(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Covalent radius of this [[Atom]], as guessed from the type.
     *
     * If no radius can be found, the radius will be 0.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.covalentRadius, 0.77);
     * atom.delete();
     * ```
     * &nbsp;
     * ```typescript doctest
     * const atom = new chemfiles.Atom('CH4');
     * assert.equal(atom.covalentRadius, 0);
     * atom.delete();
     * ```
     */
    get covalentRadius(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('double');
            check(lib._chfl_atom_covalent_radius(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Atomic number of this [[Atom]], as guessed from the type.
     *
     * If no number can be found, it will be 0.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * assert.equal(atom.atomicNumber, 6);
     * atom.delete();
     * ```
     * &nbsp;
     * ```typescript doctest
     * const atom = new chemfiles.Atom('CH4');
     * assert.equal(atom.atomicNumber, 0);
     * atom.delete();
     * ```
     */
    get atomicNumber(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('uint64_t');
            check(lib._chfl_atom_atomic_number(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the property of this atom with the given `name`, or undefined
     * if the property does not exists.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     *
     * atom.set('number', 3);
     * assert.equal(atom.get('number'), 3);
     * assert.equal(atom.get('not existing'), undefined);
     *
     * atom.delete();
     * ```
     *
     * @param  name name of the property
     * @return      value of the property if it exists
     */
    public get(name: string): PropertyType | undefined {
        return stackAutoclean(() => {
            const value = stackAlloc('char*', { initial: name });
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

    /**
     * Set a property of this atom, with the given `name` and `value`.
     *
     * The new value overwrite any pre-existing property with the same name.
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     *
     * // number property
     * atom.set('number', 3);
     *
     * // string property
     * atom.set('string', 'val');
     *
     * // boolean property
     * atom.set('bool', false);
     *
     * // vector3d property
     * atom.set('vector', [3, 4, -2]);
     * atom.delete();
     * ```
     *
     * @param name  name of the new property
     * @param value value of the new property
     */
    public set(name: string, value: PropertyType): void {
        return stackAutoclean(() => {
            const property = createProperty(value);
            const wasmName = stackAlloc('char*', { initial: name });
            check(lib._chfl_atom_set_property(this.ptr, wasmName.ptr, property));
            lib._chfl_free(property);
        });
    }

    /**
     * Get the name of all properties set on this [[Atom]].
     *
     * ```typescript doctest
     * const atom = new chemfiles.Atom('C');
     * atom.set('number', 3);
     * atom.set('string', 'val');
     *
     * assert.deepEqual(atom.properties(), ['string', 'number'])
     * atom.delete();
     * ```
     *
     * @return array containing the name of all properties
     */
    public properties(): string[] {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_atom_properties_count(this.ptr, countRef.ptr));
            const count = getValue(countRef);

            const names = stackAlloc('char*[]', { count });
            check(lib._chfl_atom_list_properties(this.ptr, names.ptr, count, 0));
            return getValue(names, { count });
        });
    }
}
