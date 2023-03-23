import { SIZEOF_CHFL_MATCH, SIZEOF_UINT64_T } from '../lib/wasm-sizes';
import { CHFL_SELECTION, c_uint64_ptr, chfl_match_ptr } from './libchemfiles';
import { lib } from './misc';

import { Pointer } from './c_ptr';
import { Frame } from './frame';

import { getValue, stackAlloc, stackAutoclean } from './stack';
import { assert, autogrowStrBuffer, check } from './utils';

assert(SIZEOF_CHFL_MATCH === 5 * SIZEOF_UINT64_T, 'wrong size for chfl_match');

/**
 * Select atoms in a {@link Frame} using chemfiles' selection language.
 *
 * The selection language is built by combining basic operations. Each basic
 * operation follows the `<selector>[(<variable>)] <operator> <value>`
 * structure, where `<operator>` is a comparison operator in
 * `== != < <= > >=`. Refer to the
 * [full documentation](https://chemfiles.org/chemfiles/latest/selections.html)
 * to know the allowed selectors and how to use them.
 */
export class Selection extends Pointer<CHFL_SELECTION, never> {
    /**
     * Create a new independent copy of the given `selection`.
     *
     * This function allocate WASM memory, which must be released with
     * {@link Selection.delete}.
     *
     * ```typescript doctest
     * const selection = new chemfiles.Selection('name O');
     * const copy = chemfiles.Selection.clone(selection);
     *
     * assert.equal(selection.string, 'name O');
     * assert.equal(copy.string, 'name O');
     *
     * selection.delete();
     * copy.delete();
     * ```
     * @param  selection {@link Selection} to copy
     */
    public static clone(selection: Selection): Selection {
        const ptr = lib._chfl_selection_copy(selection.const_ptr);
        const parent = new Pointer(ptr, false, 'Selection');
        const newSelection = Object.create(Selection.prototype) as Selection;
        Object.assign(newSelection, parent);
        return newSelection;
    }

    /**
     * Create a new {@link Selection} from the given `selection` string.
     *
     * This function allocate WASM memory, which must be released with
     * {@link Selection.delete}.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * // [...]
     *
     * const selection = new chemfiles.Selection('pairs: name(#1) O and x(#2) < 3.4');
     *
     * // this selection select two atoms at the time
     * assert.equal(selection.size, 2);
     *
     * // get the matching atoms with selection.evaluate()
     * const matches = selection.evaluate(frame);
     *
     * selection.delete();
     *
     * // [...]
     * frame.delete();
     * ```
     */
    constructor(selection: string) {
        const ptr = stackAutoclean(() => {
            const ref = stackAlloc('char*', { initial: selection });
            return lib._chfl_selection(ref.ptr);
        });
        super(ptr, false, 'Selection');
    }

    /**
     * Get the size of this {@link Selection}.
     *
     * The size of a selection is the number of atoms being selected
     * together. This value is 1 for the 'atom' context, 2 for the 'pair' and
     * 'bond' context, 3 for the 'three' and 'angles' contexts and 4 for the
     * 'four' and 'dihedral' contexts.
     *
     *
     * ```typescript doctest
     * let selection = new chemfiles.Selection('name O H');
     * assert.equal(selection.size, 1);
     * selection.delete();
     *
     * selection = new chemfiles.Selection('angles: name(#1) O and name(#2) H');
     * assert.equal(selection.size, 3);
     * selection.delete();
     * ```
     */
    get size(): number {
        return stackAutoclean(() => {
            const value = stackAlloc('uint64_t');
            check(lib._chfl_selection_size(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Get the selection string used to create this {@link Selection}.
     *
     * ```typescript doctest
     * const selection = new chemfiles.Selection('name O H');
     * assert.equal(selection.string, 'name O H');
     * selection.delete();
     * ```
     */
    get string(): string {
        return autogrowStrBuffer((ptr, size) => {
            check(lib._chfl_selection_string(this.const_ptr, ptr, size, 0));
        });
    }

    /**
     * Evaluate this {@link Selection} for the given {@link Frame},
     * return a list of matching atoms, either as an array of index or an array
     * of of tuples of indexes.
     *
     * ```typescript doctest
     * const frame = new chemfiles.Frame();
     * // the frame contains carbon, oxygen and hydrogen
     * frame.addAtom(new chemfiles.Atom('O'), [0, 0, 0]);
     * frame.addAtom(new chemfiles.Atom('H'), [0, 0, 0]);
     * frame.addAtom(new chemfiles.Atom('C'), [0, 0, 0]);
     * frame.addAtom(new chemfiles.Atom('C'), [0, 0, 0]);
     * frame.addAtom(new chemfiles.Atom('H'), [0, 0, 0]);
     * // [...]
     *
     * let selection = new chemfiles.Selection('name O H');
     * assert.deepEqual(selection.evaluate(frame), [0, 1, 4]);
     * selection.delete();
     *
     * selection = new chemfiles.Selection('pairs: name(#1) C and name(#2) H');
     * assert.deepEqual(selection.evaluate(frame), [[2, 1], [2, 4], [3, 1], [3, 4]]);
     * selection.delete();
     *
     * frame.delete();
     * ```
     *
     * @param  frame the frame to consider for matching atoms
     * @return       a list of the indexes of matching atoms
     */
    public evaluate(frame: Frame): Array<number | number[]> {
        return stackAutoclean(() => {
            const countRef = stackAlloc('uint64_t');
            check(lib._chfl_selection_evaluate(this.ptr, frame.const_ptr, countRef.ptr));
            const count = getValue(countRef);

            const matches = lib.stackAlloc(count * SIZEOF_CHFL_MATCH);
            check(lib._chfl_selection_matches(this.const_ptr, matches as chfl_match_ptr, count, 0));

            const selectionSize = this.size;
            const results = [];
            let ptr = matches;
            for (let i = 0; i < count; i++) {
                // skip the chfl_match.size field
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                ptr += SIZEOF_UINT64_T;
                if (selectionSize === 1) {
                    results.push(getValue({ ptr: ptr as c_uint64_ptr, type: 'uint64_t' }));
                    // skip the other 'atoms'
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                    ptr += 4 * SIZEOF_UINT64_T;
                } else {
                    const match = [];
                    for (let atom = 0; atom < selectionSize; atom++) {
                        match.push(getValue({ ptr: ptr as c_uint64_ptr, type: 'uint64_t' }));
                        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                        ptr += SIZEOF_UINT64_T;
                    }
                    results.push(match);

                    // skip remaining fields
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                    ptr += (4 - selectionSize) * SIZEOF_UINT64_T;
                }
            }

            return results;
        });
    }
}
