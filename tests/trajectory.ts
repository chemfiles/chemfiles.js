import * as path from 'path';

import { Atom, FS, Frame, Topology, Trajectory, UnitCell, ready } from '../src';

import { assert } from './utils';

import { DATA_ROOT, setupDataFiles } from './data';

describe('Trajectory', () => {
    before((done) => {
        ready(() => {
            setupDataFiles()
                .then(() => done())
                // eslint-disable-next-line no-console
                .catch((err) => console.error(err));
        });
    });

    it('has a number of steps', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'));
        assert.equal(trajectory.nsteps, 100);
        trajectory.close();
    });

    it('has a path', () => {
        const filepath = path.join(DATA_ROOT, 'water.xyz');
        const trajectory = new Trajectory(filepath);
        assert.equal(trajectory.path, filepath);
        trajectory.close();
    });

    it('can be closed', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'));
        const frame = new Frame();
        trajectory.read(frame);
        assert.equal(frame.size, 297);

        trajectory.close();
        assert.throws(() => trajectory.read(frame), Error);

        frame.delete();
    });

    it('supports user-specified format', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'), 'r', 'XYZ');
        assert.equal(trajectory.nsteps, 100);
        trajectory.close();
    });

    it('can read files', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'));
        const frame = new Frame();
        trajectory.read(frame);
        assert.equal(frame.size, 297);

        const positions = frame.positions;
        assert.arrayEqual(positions[0], [0.417219, 8.303366, 11.737172], 1e-12);
        assert.arrayEqual(positions[124], [5.099554, -0.045104, 14.153846], 1e-12);

        let atom = frame.atom(0);
        assert.equal(atom.name, 'O');
        atom.delete();
        atom = frame.atom(1);
        assert.equal(atom.name, 'H');
        atom.delete();

        frame.delete();
        trajectory.close();
    });

    it('can read binary files', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.trr'));
        const frame = new Frame();
        trajectory.read(frame);
        assert.equal(frame.size, 297);

        assert.arrayEqual(frame.positions[0], [0.417219, 8.303366, 11.737172], 1e-6);
        assert.arrayEqual(frame.positions[124], [5.099554, -0.045104, 14.153846], 1e-6);

        trajectory.readStep(41, frame);
        assert.equal(frame.size, 297);

        assert.arrayEqual(frame.positions[0], [0.761277, 8.106125, 10.622949], 1e-6);
        assert.arrayEqual(frame.positions[124], [5.13242, 0.079862, 14.194161], 1e-6);

        frame.delete();
        trajectory.close();
    });

    it('can read files at a specific step', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'));
        const frame = new Frame();

        trajectory.readStep(41, frame);
        assert.equal(frame.size, 297);

        let atom = frame.atom(0);
        assert.equal(atom.name, 'O');
        atom.delete();
        atom = frame.atom(1);
        assert.equal(atom.name, 'H');
        atom.delete();

        const positions = frame.positions;
        assert.arrayEqual(positions[0], [0.761277, 8.106125, 10.622949], 1e-12);
        assert.arrayEqual(positions[124], [5.13242, 0.079862, 14.194161], 1e-12);

        frame.delete();
        trajectory.close();
    });

    it('can use user-specified topology', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'));
        const frame = new Frame();

        trajectory.setTopology(path.join(DATA_ROOT, 'topology.xyz'));
        trajectory.read(frame);

        let atom = frame.atom(10);
        assert.equal(atom.name, 'Rd');
        atom.delete();

        const topology = new Topology();
        atom = new Atom('Cs');
        for (let i = 0; i < 297; i++) {
            topology.addAtom(atom);
        }
        atom.delete();

        trajectory.setTopology(topology);
        topology.delete();

        trajectory.read(frame);
        atom = frame.atom(10);
        assert.equal(atom.name, 'Cs');
        atom.delete();

        // specific format
        trajectory.setTopology(path.join(DATA_ROOT, 'topology.xyz'), 'XYZ');
        trajectory.read(frame);

        atom = frame.atom(10);
        assert.equal(atom.name, 'Rd');
        atom.delete();

        frame.delete();
        trajectory.close();
    });

    it('can use user-specified unit cell', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'));
        const frame = new Frame();

        trajectory.read(frame);
        assert.equal(frame.step, 0);
        assert.equal(frame.size, 297);

        let cell = frame.cell();
        assert.arrayEqual(cell.lengths, [0, 0, 0]);
        cell.delete();

        cell = new UnitCell([30, 30, 30]);
        trajectory.setCell(cell);
        cell.delete();

        trajectory.read(frame);
        assert.equal(frame.step, 1);

        cell = frame.cell();
        assert.arrayEqual(cell.lengths, [30, 30, 30]);
        cell.delete();

        frame.delete();
        trajectory.close();
    });

    it('can write files', () => {
        const FILEPATH = 'test-tmp.xyz';
        const frame = new Frame();
        const atom = new Atom('X');
        for (let i = 0; i < 4; i++) {
            frame.addAtom(atom, [1, 2, 3]);
        }
        atom.delete();

        const trajectory = new Trajectory(FILEPATH, 'w');
        trajectory.write(frame);
        trajectory.close();
        frame.delete();

        const expected =
            '4\n' +
            'Written by the chemfiles library\n' +
            'X 1 2 3\n' +
            'X 1 2 3\n' +
            'X 1 2 3\n' +
            'X 1 2 3\n';

        // eslint-disable-next-line
        const content = FS.readFile(FILEPATH, { encoding: 'utf8' });

        assert.equal(content, expected);

        // eslint-disable-next-line
        FS.unlink(FILEPATH);
    });
});
