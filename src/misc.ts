import * as sizes from '../lib/wasm-sizes';
import { ChemfilesModule, loadChemfiles } from './libchemfiles';
import {
    CHFL_PTR,
    FileSystem,
    c_bool_ptr,
    c_char_ptr,
    chfl_format_metadata_ptr,
} from './libchemfiles';

import { getValue, stackAlloc, stackAutoclean } from './stack';
import { assert, check } from './utils';

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
 * try {
 *     const trajectory = chemfiles.Trajectory("not-here");
 * } catch (error) {
 *     assert.equal(chemfiles.lastError(), error.message);
 * }
 * ```
 */
export function lastError(): string {
    return lib.UTF8ToString(lib._chfl_last_error());
}

/**
 * Clear the last error thrown by a chemfiles function.
 *
 * ```typescript doctest
 * try {
 *     const trajectory = chemfiles.Trajectory("not-here");
 * } catch (error) {
 *     assert.equal(chemfiles.lastError(), error.message);
 *     chemfiles.clearErrors();
 *     assert.equal(chemfiles.lastError(), "");
 * }
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

/** `FormatMetadata` contains metadata associated with one format */
export interface FormatMetadata {
    /** Name of the format */
    name: string;
    /** Extension associated with the format, or `undefined` if there is no
     * associated extension */
    extension?: string;
    /** Extended, user-facing description of the format */
    description: string;
    /** URL pointing to the format definition/reference */
    reference: string;

    /** Is reading files in this format implemented? */
    read: boolean;
    /** Is writing files in this format implemented? */
    write: boolean;
    /** Does this format support in-memory IO? */
    memory: boolean;

    /** Does this format support storing atomic positions? */
    positions: boolean;
    /** Does this format support storing atomic velocities? */
    velocities: boolean;
    /** Does this format support storing unit cell information? */
    unitCell: boolean;
    /** Does this format support storing atom names or types? */
    atoms: boolean;
    /** Does this format support storing bonds between atoms? */
    bonds: boolean;
    /** Does this format support storing residues? */
    residues: boolean;
}

const CHFL_FORMAT_METADATA_PADDING = 3;

assert(
    sizes.SIZEOF_CHFL_FORMAT_METADATA ===
        4 * sizes.SIZEOF_VOID_P + 9 * sizes.SIZEOF_BOOL + CHFL_FORMAT_METADATA_PADDING,
    'sizeof(sizeof_chfl_format_metadata) does not match the typescript code'
);

export function formatsList(): FormatMetadata[] {
    return stackAutoclean(() => {
        const metadata = [] as FormatMetadata[];

        const formats = lib.stackAlloc(sizes.SIZEOF_VOID_P);
        const countRef = stackAlloc('uint64_t');
        check(lib._chfl_formats_list(formats as chfl_format_metadata_ptr, countRef.ptr));
        const count = getValue(countRef);

        let ptr = lib.getValue(formats, '*');
        for (let i = 0; i < count; i++) {
            const name = lib.UTF8ToString(lib.getValue(ptr, '*') as c_char_ptr);
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_VOID_P;

            const extension_ptr = lib.getValue(ptr, '*') as c_char_ptr;
            const extension = extension_ptr === 0 ? undefined : lib.UTF8ToString(extension_ptr);
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_VOID_P;

            const description = lib.UTF8ToString(lib.getValue(ptr, '*') as c_char_ptr);
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_VOID_P;

            const reference = lib.UTF8ToString(lib.getValue(ptr, '*') as c_char_ptr);
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_VOID_P;

            const read = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const write = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const memory = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const positions = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const velocities = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const unitCell = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const atoms = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const bonds = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            const residues = getValue({ ptr: ptr as c_bool_ptr, type: 'bool' });
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + sizes.SIZEOF_BOOL;

            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ptr = ptr + CHFL_FORMAT_METADATA_PADDING;

            metadata.push({
                atoms,
                bonds,
                description,
                extension,
                memory,
                name,
                positions,
                read,
                reference,
                residues,
                unitCell,
                velocities,
                write,
            });
        }

        lib._chfl_free(lib.getValue(formats, '*') as CHFL_PTR);

        return metadata;
    });
}

/**
 * Get the format that chemfiles would use to read a file with the given
 * `filename`.
 *
 * Most of the time, the format is only guessed from the filename extension,
 * without reading the file to guess the format. When two or more format can
 * share the same extension (for example CIF and mmCIF), chemfiles tries to read
 * the file to distinguish between them. If reading fails, the default format
 * for this extension is returned.
 *
 * Opening the file using the returned format string might still fail. For
 * example, it will fail if the file is not actually formatted according to the
 * guessed format; or the format/compression combination is not supported (e.g.
 * `XTC / GZ` will not work since the XTC reader does not support compressed
 * files).
 *
 * @param filename name of the file to read
 * @returns the name of the format that will be used by default by chemfiles to
 *          read the file
 */
export function guessFormat(filename: string): string {
    return stackAutoclean(() => {
        const value = stackAlloc('char*', { initial: filename });
        // 64 characters should be enough for all formats in chemfiles
        const format = stackAlloc('char*', { initial: '\0'.repeat(64) });
        check(lib._chfl_guess_format(value.ptr, format.ptr, 64, 0));
        return lib.UTF8ToString(format.ptr);
    });
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
export let FS: FileSystem;

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
