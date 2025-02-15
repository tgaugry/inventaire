const _ = require('builders/utils')
const elements_ = require('controllers/listings/lib/elements')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const listings_ = require('controllers/listings/lib/listings')
const { paginate } = require('controllers/items/lib/queries_commons')
const { isNonEmptyArray } = require('lib/boolean_validations')

const sanitization = {
  uris: {},
  lists: { optional: true },
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async ({ uris, lists, offset, limit, reqUserId }) => {
  let foundElements
  if (lists) {
    foundElements = await elements_.byListingsAndEntity(lists, uris)
  } else {
    foundElements = await elements_.byEntities(uris)
  }
  // uniq here implies that a listing cannot refer several times to the same entity
  const listingsIds = _.uniq(_.map(foundElements, 'list'))
  const foundListings = await listings_.byIdsWithElements(listingsIds, reqUserId)
  const listings = await filterVisibleDocs(foundListings, reqUserId)
  const { items: authorizedListings } = paginate(listings, { offset, limit })
  const listingsByUris = {}
  const elementsByUris = _.groupBy(foundElements, 'uri')
  uris.forEach(assignListingsByUris(authorizedListings, elementsByUris, listingsByUris))
  return {
    lists: listingsByUris
  }
}

module.exports = { sanitization, controller }

const assignListingsByUris = (listings, elementsByUris, listingsByUris) => uri => {
  const listingsElements = elementsByUris[uri]
  if (!isNonEmptyArray(listingsElements)) {
    listingsByUris[uri] = []
    return
  }
  const listingsByIds = _.keyBy(listings, '_id')
  if (_.isNonEmptyPlainObject(listingsByIds)) {
    listingsByUris[uri] = Object.values(listingsByIds)
  }
  return listingsByUris
}
