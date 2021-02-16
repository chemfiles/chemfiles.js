import { Residue, Vector3D, ready } from 'chemfiles';

import { assert, disableWarnings } from './utils';

describe('Residue', () => {
    before((done) => {
        ready(() => done());
    });

    it('can be cloned', () => {
        const residue = new Residue('foo');
        const copy = Residue.clone(residue);

        assert.equal(residue.atoms.length, 0);
        assert.equal(copy.atoms.length, 0);

        residue.addAtom(4);
        residue.addAtom(2);

        assert.equal(residue.atoms.length, 2);
        assert.equal(copy.atoms.length, 0);

        residue.delete();
        copy.delete();
    });

    it('has a name', () => {
        const residue = new Residue('foo');
        assert.equal(residue.name, 'foo');
    });

    it('can have an id', () => {
        const residue = new Residue('bar', 3);
        assert.equal(residue.id, 3);
        residue.delete();

        const residueNoId = new Residue('foo');
        disableWarnings(() => {
            assert.equal(residueNoId.id, undefined);
        });
        residueNoId.delete();

        // check large id
        // INT32_MAX, INT32_MAX + Δ, UINT32_MAX, UINT32_MAX + Δ, MAX_SAFE_INTEGER
        for (const id of [
            2147483647,
            2147483649,
            4294967295,
            4294967338,
            Number.MAX_SAFE_INTEGER,
        ]) {
            const residueLargeId = new Residue('foo', id);
            assert.equal(residueLargeId.id, id);
            residueLargeId.delete();
        }
    });

    it('contains atoms', () => {
        const residue = new Residue('foo');

        assert.equal(residue.atoms.length, 0);
        residue.addAtom(3);
        residue.addAtom(18);
        residue.addAtom(6);
        assert.equal(residue.atoms.length, 3);

        assert.equal(residue.contains(3), true);
        assert.equal(residue.contains(43), false);

        assert.equal(residue.atoms[0], 3);
        assert.equal(residue.atoms[1], 6);
        assert.equal(residue.atoms[2], 18);
        assert.equal(residue.atoms[22], undefined);
        residue.delete();
    });

    it('behaves properly in presence of non-integer values', () => {
        const residue = new Residue('foo');

        assert.throw(() => residue.addAtom(-3));
        assert.throw(() => residue.addAtom(3.67));
        assert.throw(() => residue.addAtom(-3.67));

        assert.throw(() => residue.contains(-3));
        assert.throw(() => residue.contains(3.67));
        assert.throw(() => residue.contains(-3.67));

        residue.delete();
    });

    it('can have properties', () => {
        const residue = new Residue('');

        disableWarnings(() => {
            assert.equal(residue.get('foo'), undefined);
        });

        residue.set('foo', 5);
        residue.set('bar', false);
        residue.set('baz', [3, 4.5, -7]);
        residue.set('hey', 'test');

        assert.equal(residue.get('foo'), 5);
        assert.equal(residue.get('bar'), false);
        assert.arrayEqual(residue.get('baz') as Vector3D, [3, 4.5, -7]);
        assert.equal(residue.get('hey'), 'test');

        residue.set('foo', '56');
        assert.equal(residue.get('foo'), '56');

        assert.deepEqual(residue.properties(), ['hey', 'bar', 'baz', 'foo']);

        residue.delete();
    });
});
