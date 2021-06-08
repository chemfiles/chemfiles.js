declare const tag: unique symbol;
type POINTER = number;

type LLVMType = 'i8' | 'i16' | 'i32' | 'i64' | 'float' | 'double' | '*';

export interface EmscriptenModule {
    FS: FileSystem;

    HEAP8: Int8Array;
    HEAP16: Int16Array;
    HEAP32: Int32Array;
    HEAPU8: Uint8Array;
    HEAPU16: Uint16Array;
    HEAPU32: Uint32Array;
    HEAPF32: Float32Array;
    HEAPF64: Float64Array;

    getValue(ptr: POINTER, type: LLVMType): number;
    UTF8ToString(ptr: POINTER, maxBytesToRead?: number): string;
    stringToUTF8(str: string, ptr: POINTER, maxBytesToWrite: number): void;

    stackSave(): number;
    stackAlloc(size: number): POINTER;
    stackRestore(saved: number): void;

    // eslint-disable-next-line @typescript-eslint/ban-types
    addFunction(fn: Function, signature: string): POINTER;

    _malloc(size: number): POINTER;
    _free(ptr: POINTER): void;
}

export type FileSystemType = unknown;

export interface FileSystemStat {
    dev: number,
    ino: number,
    mode: number,
    nlink: number,
    uid: number,
    gid: number,
    rdev: number,
    size: number,
    atime: Date,
    mtime: Date,
    ctime: Date,
    blksize: number,
    blocks: number,
}

export type FileSystemStream = unknown;
export type OpenFlags = 'r' | 'r+' | 'w' | 'wx' | 'w+' | 'a' | 'ax' | 'a+' | 'ax+';

export const SEEK_SET = 0;
export const SEEK_CUR = 1;
export const SEEK_END = 2;

export interface FileSystem {
    MEMFS: FileSystemType;
    NODEFS: FileSystemType;
    IDBFS: FileSystemType;
    WORKERFS: FileSystemType;

    mount(type: FileSystemType, opts: unknown, mountpoint: string): void;
    unmount(mountpoint: string): void;
    syncfs(populate: boolean, callback: (err?: Error) => void): void;
    mkdir(path: string, mode?: number): void;
    symlink(oldpath: string, newpath: string): void;
    rename(oldpath: string, newpath: string): void;
    rmdir(path: string): void;
    unlink(path: string): void;
    readlink(path: string): string;
    stat(path: string): FileSystemStat;
    lstat(path: string): FileSystemStat;


    chmod(path: string, mode: number): void;
    lchmod(path: string, mode: number): void;
    fchmod(fd: number, mode: number): void;

    chown(path: string, uid: number, gid: number): void;
    lchown(path: string, uid: number, gid: number): void;
    fchown(fd: number, uid: number, gid: number): void;

    truncate(path: string, len: number): void;
    ftruncate(fd: number, len: number): void;

    utime(path: string, atime: number, mtime: number): void;

    open(path: string, flags?: OpenFlags, mode?: number): FileSystemStream;
    close(stream: FileSystemStream): void;


    llseek(stream: FileSystemStream, offset: number, whence: 0 | 1 | 2): void;
    read(stream: FileSystemStream, buffer: Uint8Array, offset: number, length: number, position?: number): void;
    write(stream: FileSystemStream, buffer: Uint8Array, offset: number, length: number, position?: number): void;

    readFile(path: string, opts?: {flags?: OpenFlags}): Uint8Array;
    readFile(path: string, opts?: {encoding: 'binary', flags?: OpenFlags}): Uint8Array;
    readFile(path: string, opts?: {encoding: 'utf8', flags?: OpenFlags}): string;

    writeFile(path: string, data: string | Uint8Array, opts?: {flags?: OpenFlags}): void;

    createLazyFile(parent: string, name: string, url: string, canRead: boolean, canWrite: boolean): FileSystemStream;
    createPreloadedFile(parent: string, name: string, url: string, canRead: boolean, canWrite: boolean): FileSystemStream;

    isFile(mode: number): boolean;
    isDir(mode: number): boolean;
    isLink(mode: number): boolean;
    isChrdev(mode: number): boolean;
    isBlkdev(mode: number): boolean;
    isSocket(mode: number): boolean;

    cwd(): string;
    chdir(path: string): void;

    lookupPath(path: string, opts?: {parent?: boolean, follow?: boolean}): {path: string, node: unknown};

    analyzePath(path: string, dontResolveLastLink?: boolean): {
        isRoot: boolean,
        exists: boolean,
        error: Error,
        name: string,
        path: string,
        object: unknown,
        parentExists: boolean,
        parentPath: string,
        parentObject: unknown,
    }

    getPath(node: unknown): string;
}
