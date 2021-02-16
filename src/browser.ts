/// <reference lib="dom" />

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import assert from 'assert';

import { FS, ready } from './misc';
import { Trajectory } from './trajectory';

let PREFIX: string;
if (typeof window === 'object') {
    PREFIX = '/chemfiles';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ready(() => FS.mkdir(PREFIX));
} else {
    // eslint-disable-next-line
    const os = require('os');
    PREFIX = os.tmpdir() as string;
}

function randomName(len: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
        const position = Math.floor(Math.random() * chars.length);
        result += chars.substring(position, position + 1);
    }
    return result;
}

function normalizePath(path: string): string {
    if (path === '') {
        do {
            // find a new name, avoiding collisions
            path = randomName(12);
        } while (FS.analyzePath(`${PREFIX}/${path}`).exists);
    }
    return `${PREFIX}/${path}`;
}

/**
 * Implementation of Trajectory for reading data from memory.
 *
 * The main use case for this is enabling reading & writing files in the
 * browser.
 *
 * This is a temporary implementation for chemfiles 0.9, since this
 * functionality was added to chemfiles 0.10. In the browser this is using
 * Emscripten MEMFS; and with node this is using temporary files.
 */
class MemoryTrajectory extends Trajectory {
    protected constructor(path: string, mode: string, format: string) {
        super(path, mode, format);
    }

    /**
     * Get the current content of the file as an array of bytes.
     *
     * When writing a trajectory, you may want to [[close]] the file first to
     * ensure all content is flushed to the buffer.
     */
    public asUint8Array(): Uint8Array {
        return FS.readFile(this.path, { encoding: 'binary' }) as Uint8Array;
    }

    /**
     * Release the memory (in browser) or drive space (in node) used by this
     * file.
     */
    public remove(): void {
        this.close();
        FS.unlink(this.path);
    }

    /**
     * Get the path used to open this in-memory [[Trajectory]]
     *
     * ```typescript
     * const trajectory = new chemfiles.MemoryReader('path/to/file.tng');
     * assert.equal(trajectory.path, 'path/to/file.tng');
     * trajectory.close();
     * ```
     */
    public get path(): string {
        assert(this._extra.jsPath !== undefined);
        return this._extra.jsPath;
    }
}

/**
 * Read a memory buffer as though it were a formatted file.
 *
 * This class inherits all methods from [[Trajectory]].
 */
export class MemoryReader extends MemoryTrajectory {
    /**
     * Read the given `data` as though it were a formatted file.
     *
     * The file format should be provided in `format`; or a `filename`
     * should be given in which case the format is guessed from the filename
     * extension. If both `format` and `filename` are provided; `format` takes
     * precedence.
     *
     * The data might come from HTTP requests, user file upload or any other
     * sources.
     *
     * @param data      buffer containing the file content
     * @param format    format to use when reading the file
     * @param filename  name of the file that is being read
     */
    constructor(data: Uint8Array, format: string = '', filename: string = '') {
        if (format === '' && filename === '') {
            throw Error('Either format or filename is required to create a MemoryReader');
        }

        const path = normalizePath(filename);
        FS.writeFile(path, data, { encoding: 'binary' });

        super(path, 'r', format);
    }
}

/**
 * Write to a memory buffer as though it were a formatted file.
 *
 * This class inherits all methods from [[Trajectory]].
 */
export class MemoryWriter extends MemoryTrajectory {
    /**
     * Write to a memory buffer as though it were a formatted file.
     *
     * The file format should be provided in `format`; or a `filename`
     * should be given in which case the format is guessed from the filename
     * extension. If both `format` and `filename` are provided; `format` takes
     * precedence.
     *
     * Before getting the file content with [[MemoryWriter.asBlob]] or
     * [[MemoryWriter.asUint8Array]]; ensure the file is flushed with
     * [[MemoryWriter.close]].
     *
     * @param data      buffer containing the file content
     * @param format    format to use when reading the file
     * @param filename  name of the file that is being read
     */
    constructor(format: string = '', filename: string = '') {
        if (format === '' && filename === '') {
            throw Error('Either format or filename is required to create a MemoryWriter');
        }

        const path = normalizePath(filename);
        super(path, 'w', format);
    }
}
