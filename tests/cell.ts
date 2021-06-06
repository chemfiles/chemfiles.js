import { CellShape, UnitCell, ready } from 'chemfiles';
import { assert } from './utils';

describe('UnitCell', () => {
    before((done) => {
        ready(() => done());
    });

    it('can be cloned', () => {
        const cell = new UnitCell([1, 1, 1]);
        const copy = UnitCell.clone(cell);

        assert.arrayEqual(cell.lengths, [1, 1, 1]);
        assert.arrayEqual(copy.lengths, [1, 1, 1]);

        cell.lengths = [3, 4, 5];
        assert.arrayEqual(cell.lengths, [3, 4, 5]);
        assert.arrayEqual(copy.lengths, [1, 1, 1]);

        cell.delete();
        copy.delete();
    });

    it('can be built from a matrix', () => {
        // prettier-ignore
        const cell = new UnitCell([
            [3, 0, 0],
            [0, 4, 0],
            [0, 0, 5],
        ]);
        assert.arrayEqual(cell.lengths, [3, 4, 5]);

        cell.delete();
    });

    it('has lengths', () => {
        const cell = new UnitCell([1, 1, 1]);
        assert.arrayEqual(cell.lengths, [1, 1, 1]);

        cell.lengths = [3, 4, 5];
        assert.arrayEqual(cell.lengths, [3, 4, 5]);

        cell.delete();
    });

    it('has angles', () => {
        let cell = new UnitCell([1, 1, 1]);
        assert.arrayEqual(cell.angles, [90, 90, 90], 1e-12);

        cell.shape = CellShape.Triclinic;
        cell.angles = [90, 110, 80];
        assert.arrayEqual(cell.angles, [90, 110, 80], 1e-12);
        cell.delete();

        cell = new UnitCell([1, 1, 1], [120, 80, 66]);
        assert.arrayEqual(cell.angles, [120, 80, 66], 1e-12);
        cell.delete();
    });

    it('has a shape', () => {
        let cell = new UnitCell([1, 1, 1]);
        assert.equal(cell.shape, CellShape.Orthorhombic);

        cell.shape = CellShape.Triclinic;
        assert.equal(cell.shape, CellShape.Triclinic);
        cell.delete();

        cell = new UnitCell([1, 1, 1], [90, 110, 90]);
        assert.equal(cell.shape, CellShape.Triclinic);
        cell.delete();
    });

    it('has a volume', () => {
        const cell = new UnitCell([2, 4, 3]);
        assert.equal(cell.volume, 2 * 4 * 3);
        cell.delete();
    });

    it('has a matricial representation', () => {
        const cell = new UnitCell([2, 4, 3]);
        assert.arrayEqual(cell.matrix[0], [2, 0, 0], 1e-12);
        assert.arrayEqual(cell.matrix[1], [0, 4, 0], 1e-12);
        assert.arrayEqual(cell.matrix[2], [0, 0, 3], 1e-12);
        cell.delete();
    });

    it('can wrap vectors', () => {
        const cell = new UnitCell([2, 2, 3]);
        assert.arrayEqual(cell.wrap([1.5, 2.5, -5]), [-0.5, 0.5, 1], 1e-12);
        cell.delete();
    });
});
