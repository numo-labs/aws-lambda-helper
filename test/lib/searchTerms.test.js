const assert = require('assert');
const index = require('../../lib/index');
const searchTerms = require('../../lib/searchTerms');

describe('searchTerms', () => {
  describe.only('toKeyString', () => {
    it('should transform searchTerms into a long string', done => {
      const terms = {
        geography: ['geo:b', 'geo:a'],
        tile: ['tile:a', 'tile:c', 'tile:b'],
        marketing: ['marketing:b', 'marketing:a'],
        amenity: 'amenity:a'
      };

      const expected = 'amenity:a,geo:a,geo:b,marketing:a,marketing:b,tile:a,tile:b,tile:c';

      assert.equal(searchTerms.toKeyString(terms), expected);

      done();
    });
    it('should be callable from the main file', done => {
      const terms = { tile: 'tile:a' };
      const expected = 'tile:a';
      assert.equal(index.searchTerms.toKeyString(terms), expected);
      done();
    });
    it('should throw an Error when there are no terms found', done => {
      try {
        index.searchTerms.toKeyString([]);
      } catch (ex) {
        assert.equal(ex.message, 'No search terms found.');
        done();
      }
    });
  });
});
