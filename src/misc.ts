import * as lib from './libchemfiles';
import {c_char_ptr, then} from './libchemfiles';

import {check} from './utils';
import {stackAlloc, stackAutoclean} from './stack';

export function version(): string {
    return lib.UTF8ToString(lib._chfl_version());
}

export function lastError(): string {
    return lib.UTF8ToString(lib._chfl_last_error());
}

export function clearErrors(): void {
    check(lib._chfl_clear_errors());
}

export function addConfiguration(path: string): void {
    stackAutoclean(() => {
        const ref = stackAlloc("char*", path);
        check(lib._chfl_add_configuration(ref.ptr));
    });
}

export type WarningCallback = (message: string) => void;
let CURRENT_CALLBACK: WarningCallback = (message) => console.warn(`[chemfiles] ${message}`);

export function setWarningCallback(callback: WarningCallback): void {
    CURRENT_CALLBACK = callback;
}

function actualCallback(message: c_char_ptr): void {
    try {
        CURRENT_CALLBACK(lib.UTF8ToString(message));
    } catch (e) {
        console.warn(`exception raised in warning callback: ${e}`)
    }
}

export function __setupWarningCallback() {
    // register 'actualCallback' as the warning callback so that a single
    // function is registered.
    //
    // The signature is set to v for 'return void' and i for 'parameter is an
    // integer'. It will actually be a 'const char*', but this should have the
    // same size as a 32-bit integer.
    check(lib._chfl_set_warning_callback(lib.addFunction(actualCallback as any, 'vi')));
}

let READY_CALLBACK = () => {};
let IS_READY = false;

/**
 * Call the given `callback` as soon as chemfiles code finishes loading, or
 * immediately if chemfiles is already loaded.
 */
export function ready(callback: () => void): void {
    if (IS_READY) {
        // directly call the callback
        callback();
    } else {
        // register it to be called below
        READY_CALLBACK = callback;
    }
}

then(() => {
    __setupWarningCallback();
    READY_CALLBACK();
    IS_READY = true;
})
