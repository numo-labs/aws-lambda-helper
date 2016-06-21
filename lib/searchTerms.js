const SEPARATOR = ',';

/**
 * Takes in the search terms and transforms it in a long string we can use
 * as a key in redis or anything else.
 *
 * @param searchTerms the search terms.
 */
const toKeyString = (searchTerms) => {
  // Make a copy so we do not modify the original search terms.
  const terms = JSON.parse(JSON.stringify(searchTerms));

  const termStrings = [];

  if (terms.amenity) termStrings.push(sanitize(terms.amenity));
  if (terms.geography) termStrings.push(sanitize(terms.geography));
  if (terms.marketing) termStrings.push(sanitize(terms.marketing));
  if (terms.tile) termStrings.push(sanitize(terms.tile));

  if (!termStrings.length) throw Error('No search terms found.');

  return termStrings.join(SEPARATOR);
};

const sanitize = (term) => Array.isArray(term) ? term.sort().join(SEPARATOR) : term;

exports.toKeyString = toKeyString;
