/// <reference lib="dom" />

import { FS } from '../../src';

async function addFileToMEMFS(path: string) {
    const response = await fetch(`base/tests/data/${path}`);
    const buffer = await response.arrayBuffer();
    const view = new Uint8Array(buffer);

    // eslint-disable-next-line
    FS.writeFile(`/tmp/${path}`, view);
}

const IS_NODE =
    typeof process === 'object' &&
    typeof process.versions === 'object' &&
    typeof process.versions.node === 'string';

// eslint-disable-next-line @typescript-eslint/no-empty-function
let setupDataFiles = async (): Promise<void> => {};

let DATA_ROOT: string;
if (IS_NODE) {
    DATA_ROOT = __dirname;
} else {
    DATA_ROOT = '/tmp';
    setupDataFiles = async (): Promise<void> => {
        await addFileToMEMFS('test-config.toml');
        await addFileToMEMFS('topology.xyz');
        await addFileToMEMFS('water.xyz');
        await addFileToMEMFS('water.trr');
    };
}

export { DATA_ROOT, setupDataFiles };
