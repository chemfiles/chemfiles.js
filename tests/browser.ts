import {Atom, Frame, MemoryReader, MemoryWriter, ready} from '../src';
import {FS} from '../src/libchemfiles';
import {assert} from './utils';

// node 10 do not export TextEncoder & TextDecoder as globals, let's do it ourself
/* eslint-disable */
if (typeof process !== 'undefined' && process.release.name === 'node' && process.version.includes("v10.")) {
    const util = require("util");
    global.TextEncoder = util.TextEncoder;
    global.TextDecoder = util.TextDecoder;
}
/* eslint-enable */

const TEST_XYZ_DATA = new TextEncoder().encode(`3

C 0 0 0
O 0 0 -1
O 0 0 1
`);

describe('MemoryReader', () => {
    before((done) => {ready(() => done()); });

    it('works with a format', () => {
        const trajectory = new MemoryReader(TEST_XYZ_DATA, 'XYZ');
        const frame = new Frame();

        trajectory.read(frame);
        assert.equal(frame.size, 3);

        trajectory.remove();
        frame.delete();
    });

    it('works with a path', () => {
        const trajectory = new MemoryReader(TEST_XYZ_DATA, '', 'test.xyz');
        const frame = new Frame();

        trajectory.read(frame);
        assert.equal(frame.size, 3);

        trajectory.remove();
        frame.delete();
    });

    it('works with both', () => {
        const trajectory = new MemoryReader(TEST_XYZ_DATA, 'XYZ', 'test.unknown');
        const frame = new Frame();

        trajectory.read(frame);
        assert.equal(frame.size, 3);

        trajectory.remove();
        frame.delete();
    });

    it('fails without format & path', () => {
        assert.throwWith(
            () => new MemoryReader(new Uint8Array()),
            'Either format or filename is required to create a MemoryReader'
        );
    });
});

let EXAMPLE_FRAME: Frame;
const EXPECTED_XYZ = `2
Written by the chemfiles library
C 1 2 3
C 5 6 7
`;

describe('MemoryWriter', () => {
    before((done) => {ready(() => {
        EXAMPLE_FRAME = new Frame();
        const atom = new Atom('C');
        EXAMPLE_FRAME.addAtom(atom, [1, 2, 3]);
        EXAMPLE_FRAME.addAtom(atom, [5, 6, 7]);
        atom.delete();

        done();
    });});

    after(() => EXAMPLE_FRAME.delete());

    it('works with a format', () => {
        const trajectory = new MemoryWriter('XYZ');

        trajectory.write(EXAMPLE_FRAME);
        trajectory.close();

        const data = new TextDecoder().decode(trajectory.asUint8Array());
        assert.equal(data, EXPECTED_XYZ);

        trajectory.remove();
    });

    it('works with a path', () => {
        const trajectory = new MemoryWriter('', 'test.xyz');
        const path = trajectory.path;

        trajectory.write(EXAMPLE_FRAME);
        trajectory.close();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const content = FS.readFile(path, {encoding: 'binary'}) as Uint8Array;
        const data = new TextDecoder().decode(content);
        assert.equal(data, EXPECTED_XYZ);

        trajectory.remove();
    });

    it('works with both', () => {
        const trajectory = new MemoryWriter('XYZ', 'test.unknown');
        const path = trajectory.path;

        trajectory.write(EXAMPLE_FRAME);
        trajectory.close();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const content = FS.readFile(path, {encoding: 'binary'}) as Uint8Array;
        const data = new TextDecoder().decode(content);
        assert.equal(data, EXPECTED_XYZ);

        trajectory.remove();
    });

    it('fails without format & path', () => {
        assert.throwWith(
            () => new MemoryWriter(''),
            'Either format or filename is required to create a MemoryWriter'
        );
    });
});
