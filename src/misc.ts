import * as lib from './libchemfiles';
import {check} from './utils';

export function version(): string {
    return lib.UTF8ToString(lib._chfl_version());
}

export function lastError(): string {
    return lib.UTF8ToString(lib._chfl_last_error());
}

export function clearErrors(): void {
    check(lib._chfl_clear_errors());
}
