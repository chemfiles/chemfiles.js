import {strict as assert} from 'assert';

import * as lib from './libchemfiles';
import {CHFL_TRAJECTORY} from './libchemfiles';

import {Pointer} from './c_ptr';
import {Frame} from './frame';
import {Topology} from './topology';
import {UnitCell} from './cell';

import {stackAlloc, stackAutoclean, getValue} from './stack';
import {check, isUnsignedInteger} from './utils';

/**
 * A [[Trajectory]] represent a physical file, from which we can read [[Frame]].
 */
export class Trajectory extends Pointer<CHFL_TRAJECTORY, {}> {
    /**
     * Open the file at the given `path` using the given `mode` and
     * optional file `format`.
     *
     * Valid modes are `'r'` for read, `'w'` for write and `'a'` for
     * append.
     *
     * The `format` parameter is needed when the file format does not match
     * the extension, or when there is not standard extension for this format.
     * If `format` is not provided, the file format will be guessed from the
     * file extension.
     *
     * This function allocate WASM memory, which must be released with
     * [[Trajectory.close]]. When writing files, [[Trajectory.close]] also
     * flush any un-written buffers.
     *
     * ```typescript
     * const trajectory = new chemfiles.Trajectory('path/to/file.nc');
     * // do science here!
     * trajectory.close();
     * ```
     * &nbsp;
     * ```typescript
     * // specify a format to use when reading/writing to this file
     * const trajectory = new chemfiles.Trajectory('path/to/file.cif', 'r', 'mmCIF');
     * // more science here!
     * trajectory.close();
     * ```
     *
     * @param path   path to the file to open
     * @param mode   whether to open the file in read, write or append mode
     * @param format format to use when reading the file
     */
    constructor(path: string, mode: string = 'r', format?: string) {
        const ptr = stackAutoclean(() => {
            const pathRef = stackAlloc("char*", {initial: path});
            if (format === undefined) {
                return lib._chfl_trajectory_open(pathRef.ptr, mode.charCodeAt(0));
            } else {
                const formatRef = stackAlloc("char*", {initial: format});
                return lib._chfl_trajectory_with_format(pathRef.ptr, mode.charCodeAt(0), formatRef.ptr);
            }
        });
        super(ptr, false);
    }

    /**
     * Get the path used to open this [[Trajectory]]
     *
     * ```typescript
     * const trajectory = new chemfiles.Trajectory('path/to/file.tng');
     * assert.equal(trajectory.path, 'path/to/file.tng');
     * trajectory.close();
     * ```
     */
    get path(): string {
        return stackAutoclean(() => {
            const value = stackAlloc("char*[]", {count: 1});
            check(lib._chfl_trajectory_path(this.const_ptr, value.ptr));
            return getValue(value, {count: 1})[0];
        });
    }

    /**
     * Get the current number of steps in this [[Trajectory]]
     *
     * ```typescript
     * const trajectory = new chemfiles.Trajectory('path/to/file.pdb');
     * assert.equal(trajectory.nsteps, 32);
     * trajectory.close();
     * ```
     */
    get nsteps(): number {
        return stackAutoclean(() => {
            const value = stackAlloc("uint64_t");
            check(lib._chfl_trajectory_nsteps(this.const_ptr, value.ptr));
            return getValue(value);
        });
    }

    /**
     * Read the next step of this [[Trajectory]] in the provided `frame`.
     *
     * ```typescript
     * const trajectory = new chemfiles.Trajectory('trajectory.xyz');
     * const frame = new chemfiles.Frame();
     *
     * trajectory.read(frame);
     * // SCIENCE!
     *
     * frame.delete();
     * trajectory.close();
     * ```
     *
     * @param frame frame to be filled with data from the trajectory
     */
    read(frame: Frame): void {
        check(lib._chfl_trajectory_read(this.ptr, frame.ptr));
    }

    /**
     * Read a specific `step` of this [[Trajectory]] in the provided `frame`.
     *
     * ```typescript
     * const trajectory = new chemfiles.Trajectory('trajectory.xyz');
     * const frame = new chemfiles.Frame();
     *
     * trajectory.readStep(13, frame);
     * // [...]
     *
     * trajectory.readStep(8, frame);
     *  // [...]
     *
     * frame.delete();
     * trajectory.close();
     * ```
     *
     * @param step  step (starting at 0) to read from the trajectory
     * @param frame frame to be filled with data from the trajectory
     */
    readStep(step: number, frame: Frame): void {
        assert(isUnsignedInteger(step), "step must be an unsigned integer");
        check(lib._chfl_trajectory_read_step(this.ptr, step, 0, frame.ptr));
    }

    /**
     * Write a [[Frame]] to this [[Trajectory]].
     *
     * ```typescript
     * const trajectory = new chemfiles.Trajectory('output.cssr', 'w');
     * // get a frame from another file, or manually create it
     * const frame = new chemfiles.Frame();
     * // [...]
     *
     * trajectory.write(frame);
     *
     * frame.delete();
     * trajectory.close();
     * ```
     * @param frame single frame to be written
     */
    write(frame: Frame): void {
        check(lib._chfl_trajectory_write(this.ptr, frame.const_ptr));
    }

    /**
     * Set the [[Topology]] associated with this [[Trajectory]].
     *
     * The new topology will be used when reading and writing the files,
     * replacing any topology in the frames or files.
     *
     * If the `topology` parameter is a [[Topology]] instance, it is used
     * directly. If the `topology` parameter is a string, the first [[Frame]] of
     * the corresponding file is read, and the topology of this frame is used.
     *
     * When reading from a file, if `format` is not `undefined`, it is used as
     * the file format instead of guessing it from the file extension.
     *
     * ```typescript
     * // AMBER NetCDF files do not contain any topological information
     * const trajectory = new chemfiles.Trajectory('simulation.nc');
     *
     * trajectory.setTopology('topology.pdb');
     * // equivalent to
     * trajectory.setTopology('topology.pdb', 'PDB');
     *
     * const frame = new chemfiles.Frame();
     * trajectory.read(frame);
     * // frame now have the provided topology
     * // [...]
     *
     * const topology = new chemfiles.Topology();
     * // setup the topology ...
     * trajectory.setTopology(topology);
     * topology.delete();
     *
     * trajectory.read(frame);
     *
     * frame.delete();
     * trajectory.close();
     * ```
     *
     * @param topology new topology use with this trajectory
     * @param format   format to use when reading the `topology` file
     */
    setTopology(topology: string | Topology, format?: string): void {
        stackAutoclean(() => {
            if (typeof topology === "string") {
                const formatRef = stackAlloc("char*", {initial: (format === undefined ? "" : format)});
                const path = stackAlloc("char*", {initial: topology});
                check(lib._chfl_trajectory_topology_file(this.ptr, path.ptr, formatRef.ptr));
            } else {
                assert(format === undefined, "can not have a format when topology is not a file path")
                check(lib._chfl_trajectory_set_topology(this.ptr, topology.const_ptr));
            }
        })
    }

    /**
     * Set the [[UnitCell]] associated with this [[Trajectory]] to a copy of
     * `cell`.
     *
     * This [[UnitCell]] will be used when reading and writing the files,
     * replacing any cell in the frames or files.
     *
     * ```typescript
     * // xyz files typically do not contain any cell information
     * const trajectory = new chemfiles.Trajectory('simulation.xyz');
     * const cell = new chemfiles.UnitCell([23, 33.4, 23]);
     * trajectory.setCell(cell);
     * cell.delete();
     *
     * const frame = new chemfiles.Frame();
     * trajectory.read(frame);
     * // frame now have the provided unit cell set
     * // [...]
     *
     * frame.delete();
     * trajectory.close();
     * ```
     *
     * @param cell unit cell to use for all read and write operations
     */
    setCell(cell: UnitCell): void {
        check(lib._chfl_trajectory_set_cell(this.ptr, cell.const_ptr));
    }

    /**
     * Close this [[Trajectory]] and write any buffered content to the file.
     *
     * ```typescript
     * const trajectory = new chemfiles.Trajectory('output.mmtf', 'w');
     * // [...]
     * trajectory.write(frame);
     * // [...]
     * trajectory.close();
     * ```
     */
    close(): void {
        // does the same as lib._chfl_trajectory_close
        this.delete();
    }

    /** @hidden */
    delete(): void {
        super.delete();
    }
}
