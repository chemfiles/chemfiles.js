import {ready, Topology, Atom, Residue} from '../src/index';
import {assert, disableWarnings} from './utils';

describe('Topology', () => {
    before((done) => {ready(() => done());});

    it('can be cloned', () => {
        const topology = new Topology();
        const copy = Topology.clone(topology);

        assert.equal(topology.size, 0);
        assert.equal(copy.size, 0);

        topology.resize(4);
        assert.equal(topology.size, 4);
        assert.equal(copy.size, 0);

        topology.delete();
        copy.delete();
    });

    it('contains atoms', () => {
        const topology = new Topology();

        assert.equal(topology.size, 0);

        let atom = new Atom("Na");
        topology.addAtom(atom);
        atom.delete();

        atom = new Atom("O");
        topology.addAtom(atom);
        atom.delete();

        assert.equal(topology.size, 2);

        atom = topology.atom(0);
        assert.equal(atom.name, "Na");
        atom.delete();

        atom = topology.atom(1);
        assert.equal(atom.name, "O");
        atom.delete();

        topology.resize(12);
        assert.equal(topology.size, 12);
        atom = topology.atom(8);
        assert.equal(atom.name, "");
        atom.delete();

        topology.remove(1);
        assert.equal(topology.size, 11);
        atom = topology.atom(0);
        assert.equal(atom.name, "Na");
        atom.delete();

        atom = topology.atom(1);
        assert.equal(atom.name, "");
        atom.delete();

        disableWarnings(() => {
            assert.throw(() => topology.atom(70));
        });

        topology.delete();
    })

    it('contains bonds/angles/dihedrals', () => {
        const topology = new Topology();
        topology.resize(4);

        topology.addBond(0, 1);
        topology.addBond(1, 2);
        topology.addBond(2, 3);

        assert.deepEqual(topology.bonds, [[0, 1], [1, 2], [2, 3]]);
        assert.deepEqual(topology.angles, [[0, 1, 2], [1, 2, 3]]);
        assert.deepEqual(topology.dihedrals, [[0, 1, 2, 3]]);

        topology.removeBond(2, 3);

        assert.deepEqual(topology.bonds, [[0, 1], [1, 2]]);
        assert.deepEqual(topology.angles, [[0, 1, 2]]);
        assert.deepEqual(topology.dihedrals, []);

        topology.delete();
    })

    it('contains residues', () => {
        const topology = new Topology();
        topology.resize(6);

        assert.equal(topology.residuesCount, 0);

        let residue = new Residue("foo");
        residue.addAtom(0);
        topology.addResidue(residue);
        residue.delete();

        residue = new Residue("bar");
        residue.addAtom(2);
        residue.addAtom(5);
        residue.addAtom(6);
        topology.addResidue(residue);
        residue.delete();

        assert.equal(topology.residuesCount, 2);

        const first = topology.residue(0);
        assert.equal(first.name, "foo");

        const second = topology.residueForAtom(5);
        assert.notEqual(second, undefined);
        assert.equal(second!.name, "bar");

        assert.equal(topology.residuesLinked(first, second!), false);
        topology.addBond(0, 2);
        assert.equal(topology.residuesLinked(first, second!), true);

        disableWarnings(() => {
            assert.throw(() => topology.residue(70));
        })

        first.delete();
        second!.delete();
        topology.delete();
    })
});
