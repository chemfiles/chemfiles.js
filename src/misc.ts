import * as lib from './libchemfiles';

export function version(): string {
    return lib.UTF8ToString(lib._chfl_version());
}

export function lastError(): string {
    return lib.UTF8ToString(lib._chfl_last_error());
}

export function clearErrors(): void {
    lib._chfl_clear_errors();
}
