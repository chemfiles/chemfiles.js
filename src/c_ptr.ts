import * as lib from './libchemfiles';
import { CHFL_PTR } from './libchemfiles';

import { lastError } from './misc';

/**
 * A wrapper for all commong behavior for C++ allocated pointers. This is an
 * internal class, used to implement the main functionality of Chemfiles'
 * objects.
 */
export class Pointer<T extends CHFL_PTR, Extra = never> {
    // store extra data for child classes
    protected _extra: Partial<Extra>;
    private _ptr: T;
    private _isConst: boolean;

    /**
     * Create a new Pointer<T> from the given value. `isConst` indicate if the
     * pointer is a `chfl_xxx *` or a `const chfl_xxx *` from the C side. Since
     * it is UB to write through a const pointer, we have to track the constness
     * of pointers.
     *
     * @param ptr     adress of the chemfiles object
     * @param isConst is the object behind the pointer const?
     */
    constructor(ptr: T, isConst: boolean) {
        if (ptr === 0) {
            throw Error(lastError());
        }
        this._ptr = ptr;
        this._isConst = isConst;
        this._extra = {};
        Object.preventExtensions(this);
    }

    /**
     * Delete the WASM-allocated object and release the corresponding memory.
     *
     * Since JavaScript have no way to inject behavior when the GC is called,
     * users need to call this function manually when they are done with the
     * object.
     */
    public delete(): void {
        lib._chfl_free(this._ptr);
        this._ptr = 0 as T;
    }

    /** @hidden
     * get the value of the pointer as a NON-CONST pointer
     */
    get ptr(): T {
        if (this._isConst) {
            throw Error(`this ${this.constructor.name} can not be modified`);
        }
        return this.const_ptr;
    }

    /** @hidden
     * get the value of the pointer as a CONST pointer
     */
    get const_ptr(): T {
        if (this._ptr === 0) {
            throw Error('trying to access an object after calling delete()');
        }

        return this._ptr;
    }
}
