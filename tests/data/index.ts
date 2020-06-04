/// <reference lib="dom" />

import {FS} from '../../src/libchemfiles';

function addFileToMEMFS(path: string) {
    window.fetch(`base/tests/data/${path}`)
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
            const view = new Uint8Array(buffer);
            // eslint-disable-next-line
            FS.writeFile(`/tmp/${path}`, view);
        })
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e));
}

const IS_NODE = typeof process === 'object' &&
                typeof process.versions === 'object' &&
                typeof process.versions.node === 'string';

let DATADIR = '';
if (IS_NODE) {
    DATADIR = __dirname;
} else {
    addFileToMEMFS('test-config.toml');
    addFileToMEMFS('topology.xyz');
    addFileToMEMFS('water.xyz');
    addFileToMEMFS('water.trr');
    DATADIR = '/tmp';
}

export {
    DATADIR,
};
