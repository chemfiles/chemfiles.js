import {ready, Trajectory, Frame, Atom, UnitCell, Topology} from '../src/index';
import {assert} from './utils';
import fs from 'fs';
import path from 'path';

describe('Trajectory', () => {
    before((done) => {ready(() => done());});

    it('can read files', () => {
        const trajectory = new Trajectory(path.join(__dirname, "data", "water.xyz"));
        assert.equal(trajectory.nsteps, 100);

        const frame = new Frame();
        trajectory.read(frame);
        assert.equal(frame.size, 297);

        let positions = frame.positions;
        assert.arrayEqual(positions[0], [0.417219, 8.303366, 11.737172], 1e-12);
        assert.arrayEqual(positions[124], [5.099554, -0.045104, 14.153846], 1e-12);

        let atom = frame.atom(0);
        assert.equal(atom.name, "O");
        atom.delete();
        atom = frame.atom(1);
        assert.equal(atom.name, "H");
        atom.delete();

        trajectory.readStep(41, frame);

        positions = frame.positions;
        assert.arrayEqual(positions[0], [0.761277, 8.106125, 10.622949], 1e-12);
        assert.arrayEqual(positions[124], [5.13242, 0.079862, 14.194161], 1e-12);

        trajectory.close();
        assert.throws(() => trajectory.read(frame), Error);

        frame.delete();
    });

    it("can use user-specified topology", () => {
        const trajectory = new Trajectory(path.join(__dirname, "data", "water.xyz"));
        const frame = new Frame();

        const topology = new Topology();
        let atom = new Atom("Cs");
        for (let i=0; i<297; i++) {
            topology.addAtom(atom);
        }
        atom.delete();

        trajectory.setTopology(topology);
        topology.delete();

        trajectory.read(frame);
        atom = frame.atom(10);
        assert.equal(atom.name, "Cs");
        atom.delete();

        trajectory.setTopology(path.join(__dirname, "data", "topology.xyz"));
        trajectory.read(frame);

        atom = frame.atom(10);
        assert.equal(atom.name, "Rd");
        atom.delete();

        frame.delete()
        trajectory.close();
    });

    it("can use user-specified unit cell", () => {
        const trajectory = new Trajectory(path.join(__dirname, "data", "water.xyz"));
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
        const FILEPATH = "test-tmp.xyz";
        const frame = new Frame();
        const atom = new Atom("X");
        for (let i=0; i<4; i++) {
            frame.addAtom(atom, [1, 2, 3]);
        }
        atom.delete();

        const trajectory = new Trajectory(FILEPATH, 'w');
        trajectory.write(frame);
        trajectory.close();
        frame.delete();

        const expected = "4\n" +
                         "Written by the chemfiles library\n" +
                         "X 1 2 3\n" +
                         "X 1 2 3\n" +
                         "X 1 2 3\n" +
                         "X 1 2 3\n";

        const content = fs.readFileSync(FILEPATH, {encoding: 'utf8'});

        assert.equal(content, expected);
        fs.unlink(FILEPATH, () => {});
    });
});
