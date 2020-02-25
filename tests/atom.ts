import {assert}  from 'chai';
import {ready, Atom} from '../src/index';

describe('Atom', () => {
    before((done) => {ready(() => done());});

    it('has a name', () => {
        const atom = new Atom("He");
        assert.equal(atom.name, "He");

        atom.name = "Zn";
        assert.equal(atom.name, "Zn");

        atom.delete();
    });

    it('has a type', () => {
        const atom = new Atom("C1");
        assert.equal(atom.name, "C1");
        assert.equal(atom.type, "C1");

        atom.type = "C";
        assert.equal(atom.type, "C");

        atom.delete();
    });

    it('has a mass', () => {
        const atom = new Atom("C");
        assert.equal(atom.mass, 12.011);

        atom.mass = 42;
        assert.equal(atom.mass, 42);

        atom.delete();
    });

    it('has a charge', () => {
        const atom = new Atom("C");
        assert.equal(atom.charge, 0);

        atom.charge = -2.1;
        assert.equal(atom.charge, -2.1);

        atom.delete();
    });

    it('can have a full name', () => {
        let atom = new Atom("C");
        assert.equal(atom.fullName, "Carbon");
        atom.delete();

        atom = new Atom("C1");
        assert.equal(atom.fullName, "");
        atom.delete();
    });

    it('can have a VdW radius', () => {
        let atom = new Atom("C");
        assert.equal(atom.VdWRadius, 1.7);
        atom.delete();

        atom = new Atom("C1");
        assert.equal(atom.VdWRadius, 0);
        atom.delete();
    });

    it('can have a covalent radius', () => {
        let atom = new Atom("C");
        assert.equal(atom.covalentRadius, 0.77);
        atom.delete();

        atom = new Atom("C1");
        assert.equal(atom.covalentRadius, 0);
        atom.delete();
    });

    it('can have an atomic number', () => {
        let atom = new Atom("C");
        assert.equal(atom.atomicNumber, 6);
        atom.delete();

        atom = new Atom("C1");
        assert.equal(atom.atomicNumber, 0);
        atom.delete();
    });
});
