import * as path from 'path';

import { Atom, BondOrder, Frame, Residue, Topology, Trajectory, UnitCell, Vector3d } from '../src/';
import { ready } from '../src/';

import { assert, disableWarnings } from './utils';

import { DATA_ROOT, setupDataFiles } from './data';

describe('Frame', () => {
    before((done) => {
        ready(() => {
            setupDataFiles()
                .then(() => done())
                // eslint-disable-next-line no-console
                .catch((err) => console.error(err));
        });
    });

    it('can be cloned', () => {
        const frame = new Frame();
        const copy = Frame.clone(frame);

        assert.equal(frame.step, 0);
        assert.equal(copy.step, 0);

        frame.step = 2;
        assert.equal(frame.step, 2);
        assert.equal(copy.step, 0);

        frame.delete();
        copy.delete();
    });

    it('has a step', () => {
        const frame = new Frame();
        assert.equal(frame.step, 0);

        frame.step = 2;
        assert.equal(frame.step, 2);
        frame.delete();
    });

    it('has a cell', () => {
        const frame = new Frame();
        let cell = frame.cell();
        assert.arrayEqual(cell.lengths, [0, 0, 0]);
        cell.delete();

        cell = new UnitCell([3, 4, 5]);
        frame.setCell(cell);
        cell.delete();

        cell = frame.cell();
        assert.arrayEqual(cell.lengths, [3, 4, 5]);
        cell.delete();

        frame.delete();
    });

    it('has a topology', () => {
        const frame = new Frame();
        frame.resize(3);
        frame.addBond(0, 1);
        frame.addBond(2, 1, BondOrder.Aromatic);

        let residue = new Residue('resname');
        residue.addAtom(0);
        frame.addResidue(residue);
        residue.delete();

        let topology = frame.topology();

        assert.equal(topology.residuesCount, 1);
        residue = topology.residue(0);
        assert.deepEqual(residue.atoms, [0]);
        assert.equal(residue.name, 'resname');
        residue.delete();

        assert.deepEqual(topology.bonds, [
            [0, 1],
            [1, 2],
        ]);
        assert.deepEqual(topology.bondOrders, [BondOrder.Unknown, BondOrder.Aromatic]);

        // no mutable access to the topology
        assert.throwWith(() => topology.atom(0), 'this Topology can not be modified');
        topology.delete();

        frame.removeBond(0, 1);
        topology = frame.topology();
        assert.deepEqual(topology.bonds, [[1, 2]]);
        topology.delete();

        frame.delete();
    });

    it('a new topology can be set', () => {
        const frame = new Frame();
        frame.resize(2);
        let atom = frame.atom(0);
        assert.equal(atom.name, '');
        atom.delete();

        const topology = new Topology();
        atom = new Atom('Na');
        topology.addAtom(atom);
        atom.delete();

        atom = new Atom('Be');
        topology.addAtom(atom);
        atom.delete();

        frame.setTopology(topology);
        topology.delete();

        atom = frame.atom(0);
        assert.equal(atom.name, 'Na');
        atom.delete();

        atom = frame.atom(1);
        assert.equal(atom.name, 'Be');
        atom.delete();

        frame.delete();
    });

    it('can guess bonds', () => {
        const trajectory = new Trajectory(path.join(DATA_ROOT, 'water.xyz'));
        const frame = new Frame();
        trajectory.read(frame);

        frame.guessBonds();
        const topology = frame.topology();
        assert.equal(topology.bonds.length, 186);
        assert.equal(topology.angles.length, 87);

        topology.delete();
        frame.delete();
        trajectory.close();
    });

    it('contains atoms', () => {
        const frame = new Frame();
        assert.equal(frame.size, 0);

        let atom = new Atom('');
        frame.addAtom(atom, [0, 0, 0]);
        atom.delete();
        atom = new Atom('Fe');
        frame.addAtom(atom, [0, 0, 0]);
        atom.delete();

        atom = frame.atom(0);
        assert.equal(atom.name, '');
        atom.delete();

        atom = frame.atom(1);
        assert.equal(atom.name, 'Fe');
        atom.delete();

        assert.equal(frame.size, 2);

        frame.resize(67);
        assert.equal(frame.size, 67);

        frame.remove(21);
        frame.remove(18);
        assert.equal(frame.size, 65);

        disableWarnings(() => {
            assert.throwWith(
                () => frame.atom(70),
                'out of bounds atomic index in `chfl_atom_from_frame`: we have 65 atoms, but the index is 70'
            );
        });

        frame.delete();
    });

    it('has positions', () => {
        const frame = new Frame();

        const atom = new Atom('');
        frame.addAtom(atom, [1, 2, 3]);
        frame.addAtom(atom, [4, 5, 6]);
        atom.delete();

        let positions = frame.positions;
        assert.equal(positions.length, 2);

        assert.arrayEqual(positions[0], [1, 2, 3]);
        assert.arrayEqual(positions[1], [4, 5, 6]);
        positions[0] = [0, 0, 67];
        positions[1][1] = 22;

        positions = frame.positions;
        assert.arrayEqual(positions[0], [0, 0, 67]);
        assert.arrayEqual(positions[1], [4, 22, 6]);

        frame.delete();
    });

    it('Array3D behaves sensibly', () => {
        const frame = new Frame();
        const atom = new Atom('');
        frame.addAtom(atom, [1, 2, 3]);
        frame.addAtom(atom, [4, 5, 6]);
        atom.delete();

        let sum = 0;
        for (const p of frame.positions) {
            sum += p[0] + p[1] + p[2];
        }
        assert.equal(sum, 21);

        /* eslint-disable */
        const positions = frame.positions as any;
        assert.arrayEqual(positions[0], [1, 2, 3]);
        assert.arrayEqual(positions['0'], [1, 2, 3]);

        assert.equal(positions[-1], undefined);
        assert.equal(positions['1ff'], undefined);
        assert.equal(positions['1.3'], undefined);
        assert.equal(positions[4.6], undefined);

        positions[0] = [7, 9, 3.3];
        assert.arrayEqual(positions[0], [7, 9, 3.3]);

        assert.throw(() => {
            positions[0] = 'nope';
        });
        /* eslint-enable */

        frame.delete();
    });

    it('can have velocities', () => {
        const frame = new Frame();

        const atom = new Atom('');
        frame.addAtom(atom, [1, 2, 3]);
        frame.addAtom(atom, [4, 5, 6]);

        assert.equal(frame.velocities, undefined);
        frame.addVelocities();
        assert.notEqual(frame.velocities, undefined);

        frame.addAtom(atom, [0, 0, 0], [1, 2, 3]);
        frame.addAtom(atom, [0, 0, 0], [4, 5, 6]);
        atom.delete();

        let velocities = frame.velocities;
        if (velocities === undefined) {
            throw Error('expected the frame to have velocities');
        }
        assert.equal(velocities.length, 4);

        assert.arrayEqual(velocities[0], [0, 0, 0]);
        assert.arrayEqual(velocities[1], [0, 0, 0]);
        assert.arrayEqual(velocities[2], [1, 2, 3]);
        assert.arrayEqual(velocities[3], [4, 5, 6]);

        velocities[0] = [0, 0, 67];
        velocities[1][1] = 22;
        velocities = frame.velocities;
        if (velocities === undefined) {
            throw Error('expected the frame to have velocities');
        }
        assert.arrayEqual(velocities[0], [0, 0, 67]);
        assert.arrayEqual(velocities[1], [0, 22, 0]);

        frame.delete();
    });

    it('can compute distances', () => {
        const frame = new Frame();
        const cell = new UnitCell([3.0, 4.0, 5.0]);
        frame.setCell(cell);
        cell.delete();

        const atom = new Atom('');
        frame.addAtom(atom, [0, 0, 0]);
        frame.addAtom(atom, [1, 2, 6]);
        atom.delete();

        assert.equal(frame.distance(0, 1), Math.sqrt(6.0));
        frame.delete();
    });

    it('can compute angles', () => {
        const frame = new Frame();
        const atom = new Atom('');
        frame.addAtom(atom, [1, 0, 0]);
        frame.addAtom(atom, [0, 0, 0]);
        frame.addAtom(atom, [0, 1, 0]);
        atom.delete();

        assert.equal(frame.angle(0, 1, 2), Math.PI / 2);
        frame.delete();
    });

    it('can compute dihedral angles', () => {
        const frame = new Frame();
        const atom = new Atom('');
        frame.addAtom(atom, [1, 0, 0]);
        frame.addAtom(atom, [0, 0, 0]);
        frame.addAtom(atom, [0, 1, 0]);
        frame.addAtom(atom, [-1, -1, 0]);
        atom.delete();

        assert.equal(frame.dihedral(0, 1, 2, 3), Math.PI);
        frame.delete();
    });

    it('can compute out of plane distance', () => {
        const frame = new Frame();
        const atom = new Atom('');
        frame.addAtom(atom, [1, 0, 0]);
        frame.addAtom(atom, [0, 0, 0]);
        frame.addAtom(atom, [0, 1, 0]);
        frame.addAtom(atom, [0, 0, 3]);
        atom.delete();

        assert.equal(frame.outOfPlane(0, 3, 2, 1), 3);
        frame.delete();
    });

    it('can have properties', () => {
        const frame = new Frame();

        disableWarnings(() => {
            assert.equal(frame.get('foo'), undefined);
        });

        frame.set('foo', 5);
        frame.set('bar', false);
        frame.set('baz', [3, 4.5, -7]);
        frame.set('hey', 'test');

        assert.equal(frame.get('foo'), 5);
        assert.equal(frame.get('bar'), false);
        assert.arrayEqual(frame.get('baz') as Vector3d, [3, 4.5, -7]);
        assert.equal(frame.get('hey'), 'test');

        frame.set('foo', '56');
        assert.equal(frame.get('foo'), '56');

        assert.deepEqual(frame.properties(), ['hey', 'bar', 'baz', 'foo']);
        frame.delete();
    });
});
