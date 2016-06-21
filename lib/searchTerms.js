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

  // Check for amenity
  if (terms.amenity) {
    const amenity = sanitize(terms.amenity);
    if (amenity.length) termStrings.push(amenity);
  }

  // Check for geography
  if (terms.geography) {
    const geography = sanitize(terms.geography);
    if (geography.length) termStrings.push(geography);
  }

  // Check for marketing
  if (terms.marketing) {
    const marketing = sanitize(terms.marketing);
    if (marketing.length) termStrings.push(marketing);
  }

  if (terms.tile) {
    const tile = sanitize(terms.tile);
    if (tile.length) termStrings.push(tile);
  }

  if (!termStrings.length) throw Error('No search terms found.');

  return termStrings.join(SEPARATOR);
};

const sanitize = (term) => Array.isArray(term) ? term.sort().join(SEPARATOR) : term;

exports.toKeyString = toKeyString;
