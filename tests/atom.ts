import { Atom, Vector3d, ready } from '../src/';

import { assert, disableWarnings } from './utils';

describe('Atom', () => {
    before((done) => {
        ready(() => done());
    });

    it('can be cloned', () => {
        const atom = new Atom('He');
        const copy = Atom.clone(atom);

        assert.equal(atom.name, 'He');
        assert.equal(copy.name, 'He');

        atom.name = 'Zn';
        assert.equal(atom.name, 'Zn');
        assert.equal(copy.name, 'He');

        atom.delete();
        copy.delete();
    });

    it('has a name', () => {
        const atom = new Atom('He');
        assert.equal(atom.name, 'He');

        atom.name = 'Zn';
        assert.equal(atom.name, 'Zn');

        atom.delete();
    });

    it('can have a very long name', () => {
        const name = 'He'.repeat(100);
        const atom = new Atom(name);
        assert.equal(atom.name, name);
        atom.delete();
    });

    it('has a type', () => {
        const atom = new Atom('C1');
        assert.equal(atom.name, 'C1');
        assert.equal(atom.type, 'C1');

        atom.type = 'C';
        assert.equal(atom.type, 'C');

        atom.delete();
    });

    it('has a mass', () => {
        const atom = new Atom('C');
        assert.equal(atom.mass, 12.011);

        atom.mass = 42;
        assert.equal(atom.mass, 42);

        atom.delete();
    });

    it('has a charge', () => {
        const atom = new Atom('C');
        assert.equal(atom.charge, 0);

        atom.charge = -2.1;
        assert.equal(atom.charge, -2.1);

        atom.delete();
    });

    it('can have a full name', () => {
        let atom = new Atom('C');
        assert.equal(atom.fullName, 'Carbon');
        atom.delete();

        atom = new Atom('C1');
        assert.equal(atom.fullName, '');
        atom.delete();
    });

    it('can have a VdW radius', () => {
        let atom = new Atom('C');
        assert.equal(atom.VdWRadius, 1.7);
        atom.delete();

        atom = new Atom('C1');
        assert.equal(atom.VdWRadius, 0);
        atom.delete();
    });

    it('can have a covalent radius', () => {
        let atom = new Atom('C');
        assert.equal(atom.covalentRadius, 0.77);
        atom.delete();

        atom = new Atom('C1');
        assert.equal(atom.covalentRadius, 0);
        atom.delete();
    });

    it('can have an atomic number', () => {
        let atom = new Atom('C');
        assert.equal(atom.atomicNumber, 6);
        atom.delete();

        atom = new Atom('C1');
        assert.equal(atom.atomicNumber, 0);
        atom.delete();
    });

    it('can have properties', () => {
        const atom = new Atom('C');

        disableWarnings(() => {
            assert.equal(atom.get('foo'), undefined);
        });

        atom.set('foo', 5);
        atom.set('bar', false);
        atom.set('baz', [3, 4.5, -7]);
        atom.set('hey', 'test');

        assert.equal(atom.get('foo'), 5);
        assert.equal(atom.get('bar'), false);
        assert.arrayEqual(atom.get('baz') as Vector3d, [3, 4.5, -7]);
        assert.equal(atom.get('hey'), 'test');

        atom.set('foo', '56');
        assert.equal(atom.get('foo'), '56');

        assert.deepEqual(atom.properties(), ['hey', 'bar', 'baz', 'foo']);

        atom.delete();
    });
});
