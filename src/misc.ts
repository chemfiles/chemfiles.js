import { ChemfilesModule, loadChemfiles } from './libchemfiles';
import { c_char_ptr } from './libchemfiles';

import { stackAlloc, stackAutoclean } from './stack';
import { check } from './utils';

/**
 * Get the version of chemfiles being used as a string
 *
 * ```typescript doctest
 * console.log(chemfiles.version());
 * ```
 */
export function version(): string {
    return lib.UTF8ToString(lib._chfl_version());
}

/**
 * Get the last error thrown by a chemfiles function.
 *
 * Use [[clearErrors]] to reset this to an empty string.
 *
 * ```typescript doctest
 * // TODO: write doc example once Trajectory class written
 * ```
 */
export function lastError(): string {
    return lib.UTF8ToString(lib._chfl_last_error());
}

/**
 * Clear the last error thrown by a chemfiles function.
 *
 * ```typescript doctest
 * // TODO: write doc example once Trajectory class written
 * ```
 */
export function clearErrors(): void {
    check(lib._chfl_clear_errors());
}

/**
 * Read the chemfiles
 * [configuration](http://chemfiles.org/chemfiles/latest/configuration.html)
 * file at the given `path`
 *
 * ```typescript
 * chemfiles.addConfiguration('path/to/config.toml');
 * ```
 *
 * @param path path to the configuration file
 */
export function addConfiguration(path: string): void {
    stackAutoclean(() => {
        const ref = stackAlloc('char*', { initial: path });
        check(lib._chfl_add_configuration(ref.ptr));
    });
}

/** Type of callbacks used by chemfiles' warning systems */
export type WarningCallback = (message: string) => void;

// eslint-disable-next-line no-console
let CURRENT_CALLBACK: WarningCallback = (message) => console.warn(`[chemfiles] ${message}`);

/**
 * Set the given function `callback` as warning handler.
 *
 * By default, warnings are send to `console.warn`.
 *
 * @param callback new warning callback to use
 */
export function setWarningCallback(callback: WarningCallback): void {
    CURRENT_CALLBACK = callback;
}

// Function to be registered on the C/WASM side with addFunction, see below
function actualCallback(message: c_char_ptr): void {
    try {
        CURRENT_CALLBACK(lib.UTF8ToString(message));
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('exception raised in warning callback:', e);
    }
}

function __setupWarningCallback() {
    // register 'actualCallback' as the warning callback so that a single
    // function is registered.
    //
    // The signature is set to v for 'return void' and i for 'parameter is an
    // integer'. It will actually be a 'const char*', but this should have the
    // same size as a 32-bit integer.
    check(lib._chfl_set_warning_callback(lib.addFunction(actualCallback, 'vi')));
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const READY_CALLBACKS: Array<() => void> = [];
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
        READY_CALLBACKS.push(callback);
    }
}

/** @hidden
 * Instance of the chemfiles WASM module, on which all function should be
 * called. This is only set and available once the WASM code has been fully
 * loaded and compiled.
 */
export let lib: ChemfilesModule;

/**
 * Re-export of the filesystem namespace from Emscripten.
 *
 * This should not be needed for the majority of users. See
 * https://emscripten.org/docs/api_reference/Filesystem-API.html
 * for the corresponding documentation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let FS: any;

loadChemfiles()
    .then((new_instance) => {
        lib = new_instance;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        FS = new_instance.FS;

        __setupWarningCallback();
        for (const callback of READY_CALLBACKS) {
            callback();
        }
        IS_READY = true;
    })
    .catch((err: string) => {
        // eslint-disable-next-line no-console
        console.error(`failed to load WASM: ${err}`);
    });
