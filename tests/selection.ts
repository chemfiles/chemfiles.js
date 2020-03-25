import {ready, Frame, Atom, Selection} from '../src/index';
import {assert} from './utils';

describe('Selection', () => {
    before((done) => {ready(() => done());});

    it('can be cloned', () => {
        const selection = new Selection("pairs: all");
        const copy = Selection.clone(selection);
        assert.equal(selection.string, "pairs: all");
        assert.equal(copy.string, "pairs: all");

        selection.delete();
        copy.delete();
    });

    it('has a size', () => {
        const selection = new Selection("pairs: all");
        assert.equal(selection.size, 2);
        selection.delete();
    })

    it('has a string', () => {
        const selection = new Selection("pairs: all");
        assert.equal(selection.string, "pairs: all");
        selection.delete();
    })

    it('can select data on a frame', () => {
        const frame = new Frame();
        frame.addAtom(new Atom("H"), [0, 0, 0]);
        frame.addAtom(new Atom("O"), [0, 0, 0]);
        frame.addAtom(new Atom("O"), [0, 0, 0]);
        frame.addAtom(new Atom("H"), [0, 0, 0]);

        let selection = new Selection("name O")
        let matches = selection.evaluate(frame);
        assert.deepEqual(matches, [1, 2]);
        selection.delete();

        selection = new Selection("pairs: name(#1) O and name(#2) H")
        matches = selection.evaluate(frame);
        assert.deepEqual(matches, [[1, 0], [1, 3], [2, 0], [2, 3]]);
        selection.delete();

        selection = new Selection("three: name(#1) O and name(#2) H and name(#3) O")
        matches = selection.evaluate(frame);
        assert.deepEqual(matches, [[1, 0, 2], [1, 3, 2], [2, 0, 1], [2, 3, 1]]);
        selection.delete();

        selection = new Selection("four: name(#1) O and name(#2) H and name(#3) O")
        matches = selection.evaluate(frame);
        assert.deepEqual(matches, [[1, 0, 2, 3], [1, 3, 2, 0], [2, 0, 1, 3], [2, 3, 1, 0]]);
        selection.delete();

        frame.delete();
    })
});
