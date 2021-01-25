import { strict as assert } from 'assert';

import * as lib from './libchemfiles';
import { CHFL_RESIDUE, chfl_status } from './libchemfiles';

import { Pointer } from './c_ptr';

import { PropertyType, createProperty, getProperty } from './property';
import { getValue, stackAlloc, stackAutoclean } from './stack';
import { autogrowStrBuffer, check, isUnsignedInteger, numberEmscriptenUint64 } from './utils';

interface ResidueExtra {
    atoms: ReadonlyArray<number>;
}

/**
 * A [[Residue]] is a group of atoms belonging to the same logical unit.
 * They can be small molecules, amino-acids in a protein, monomers in
 * polymers, *etc*.
 */
export class Residue extends Pointer<CHFL_RESIDUE, ResidueExtra> {
    /** @hidden
     * Create a new [[Residue]] from a raw pointer
     */
    public static __from_ptr(ptr: CHFL_RESIDUE, isConst: boolean): Residue {
        const parent = new Pointer(ptr, isConst);
        const atom = Object.create(Residue.prototype) as Residue;
        Object.assign(atom, parent);
        return atom;
    }

    /**
     * Create a new independant copy of the given `residue`.
     *
     * This function allocate WASM memory, which must be released with
     * [[Residue.delete]].
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     * const copy = chemfiles.Residue.clone(residue);
     *
     * assert.equal(residue.atoms.length, 0);
     * assert.equal(copy.atoms.length, 0);
     *
     * // only residue is modified, not copy
     * residue.addAtom(33);
     * assert.equal(residue.atoms.length, 1);
     * assert.equal(copy.atoms.length, 0);
     *
     * residue.delete();
     * copy.delete();
     * ```
     *
     * @param  residue [[Residue]] to copy
     */
    public static clone(residue: Residue): Residue {
        const ptr = lib._chfl_residue_copy(residue.const_ptr);
        return Residue.__from_ptr(ptr, false);
    }

    /**
     * Create a new [[Residue]] with the given `name` and optional residue `id`.
     *
     * This function allocate WASM memory, which must be released with
     * [[Residue.delete]].
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     * assert.equal(residue.name, 'ALA');
     * assert.equal(residue.id, undefined);
     * residue.delete();
     * ```
     * &nbsp;
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ARG', 42);
     * assert.equal(residue.name, 'ARG');
     * assert.equal(residue.id, 42);
     * residue.delete();
     * ```
     *
     * @param name name of the residue
     * @param id   numeric identifier of the residue
     */
    constructor(name: string, id?: number) {
        const ptr = stackAutoclean(() => {
            const nameRef = stackAlloc('char*', { initial: name });
            if (id === undefined) {
                return lib._chfl_residue(nameRef.ptr);
            } else {
                assert(isUnsignedInteger(id), 'residue id must be a positive integer');
                const { lo, hi } = numberEmscriptenUint64(id);
                return lib._chfl_residue_with_id(nameRef.ptr, lo, hi);
            }
        });
        super(ptr, false);
        this._extra.atoms = undefined;
    }

    /**
     * Get the residue id of this [[Residue]], or undefined if the residue have
     * no residue id.
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA', 33);
     * assert.equal(residue.id, 33);
     * residue.delete();
     * ```
     */
    get id(): number | undefined {
        return stackAutoclean(() => {
            const value = stackAlloc('uint64_t');
            const status = lib._chfl_residue_id(this.const_ptr, value.ptr);
            if (status === chfl_status.CHFL_GENERIC_ERROR) {
                return undefined;
            } else {
                check(status);
                return getValue(value);
            }
        });
    }

    /**
     * Get the name of this [[Residue]]
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     * assert.equal(residue.name, 'ALA');
     * residue.delete();
     * ```
     */
    get name(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_residue_name(this.const_ptr, ptr, size, 0));
        });
    }

    /**
     * Get the list of atoms part of this [[Residue]].
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     * assert.deepEqual(residue.atoms, []);
     *
     * residue.addAtom(1233);
     * residue.addAtom(67);
     * residue.addAtom(6249);
     *
     * assert.deepEqual(residue.atoms, [67, 1233, 6249]);
     * residue.delete();
     * ```
     */
    get atoms(): ReadonlyArray<number> {
        // atoms are cached on first access in this._extra.atoms
        if (this._extra.atoms === undefined) {
            this._extra.atoms = stackAutoclean(() => {
                const countRef = stackAlloc('uint64_t');
                check(lib._chfl_residue_atoms_count(this.const_ptr, countRef.ptr));
                const count = getValue(countRef);

                const value = stackAlloc('uint64_t[]', { count });
                check(lib._chfl_residue_atoms(this.const_ptr, value.ptr, count, 0));
                const atoms = getValue(value, { count });
                Object.freeze(atoms);
                return atoms;
            });
        }
        return this._extra.atoms;
    }

    /**
     * Check if this [[Residue]] contains the given `atom`
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     *
     * assert.equal(residue.contains(67), false);
     *
     * residue.addAtom(67);
     * residue.addAtom(69);
     *
     * assert.equal(residue.contains(67), true);
     * assert.equal(residue.contains(68), false);
     * residue.delete();
     * ```
     *
     * @param  atom index of the atom to check
     */
    public contains(atom: number): boolean {
        assert(isUnsignedInteger(atom), 'atom id should be positive integers');
        return stackAutoclean(() => {
            const value = stackAlloc('bool');
            check(lib._chfl_residue_contains(this.const_ptr, atom, 0, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Add a new `atom` to this [Residue]
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     * assert.deepEqual(residue.atoms, []);
     *
     * residue.addAtom(67);
     * residue.addAtom(69);
     *
     * assert.deepEqual(residue.atoms, [67, 69]);
     * residue.delete();
     * ```
     *
     * @param atom index of the atom to add
     */
    public addAtom(atom: number): void {
        assert(isUnsignedInteger(atom), 'atom id should be positive integers');
        this._extra.atoms = undefined;
        check(lib._chfl_residue_add_atom(this.ptr, atom, 0));
    }

    /**
     * Get the property of this residue with the given `name`, or undefined
     * if the property does not exists.
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     *
     * residue.set('number', 3);
     * assert.equal(residue.get('number'), 3);
     * assert.equal(residue.get('not existing'), undefined);
     *
     * residue.delete();
     * ```
     *
     * @param  name name of the property
     * @return      value of the property if it exists
     */
    public get(name: string): PropertyType | undefined {
        return stackAutoclean(() => {
            const value = stackAlloc('char*', { initial: name });
            const property = lib._chfl_residue_get_property(this.const_ptr, value.ptr);
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
     * Set a property of this residue, with the given `name` and `value`.
     *
     * The new value overwrite any pre-existing property with the same name.
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('ALA');
     *
     * // number property
     * residue.set('number', 3);
     *
     * // string property
     * residue.set('string', 'val');
     *
     * // boolean property
     * residue.set('bool', false);
     *
     * // vector3d property
     * residue.set('vector', [3, 4, -2]);
     * residue.delete();
     * ```
     *
     * @param name  name of the new property
     * @param value value of the new property
     */
    public set(name: string, value: PropertyType): void {
        return stackAutoclean(() => {
            const property = createProperty(value);
            const wasmName = stackAlloc('char*', { initial: name });
            check(lib._chfl_residue_set_property(this.ptr, wasmName.ptr, property));
            lib._chfl_free(property);
        });
    }

    /**
     * Get the name of all properties set on this [[Residue]].
     *
     * ```typescript doctest
     * const residue = new chemfiles.Residue('C');
     * residue.set('number', 3);
     * residue.set('string', 'val');
     *
     * assert.deepEqual(residue.properties(), ['string', 'number'])
     * residue.delete();
     * ```
     *
     * @return array containing the name of all properties
     */
    public properties(): string[] {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_residue_properties_count(this.ptr, countRef.ptr));
            const count = getValue(countRef);

            const names = stackAlloc('char*[]', { count });
            check(lib._chfl_residue_list_properties(this.ptr, names.ptr, count, 0));
            return getValue(names, { count });
        });
    }
}
