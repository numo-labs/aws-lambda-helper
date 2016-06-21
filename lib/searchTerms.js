/**
 * Takes in the search terms and transforms it in a long string we can use
 * as a key in redis or anything else.
 *
 * @param searchTerms the search terms.
 */
const toKeyString = (searchTerms) => {
  const terms = [];

  if (searchTerms.amenity) terms.push(sanitize(searchTerms.amenity));
  if (searchTerms.geography) terms.push(sanitize(searchTerms.geography));
  if (searchTerms.marketing) terms.push(sanitize(searchTerms.marketing));
  if (searchTerms.tile) terms.push(sanitize(searchTerms.tile));

  if (terms.length === 0) throw Error('No search terms found.');

  return terms.join(',');
};

const sanitize = (searchTerm) => Array.isArray(searchTerm) ? searchTerm.sort().join(',') : searchTerm;

exports.toKeyString = toKeyString;
