const _ = require('builders/utils')
const Listing = require('models/listing')
const db = require('db/couchdb/base')('lists')
const { updatable: updateAttributes } = require('models/attributes/listing')
const { validateVisibilityKeys } = require('lib/visibility/visibility')
const error_ = require('lib/error/error')
const elements_ = require('controllers/listings/lib/elements')
const { filterFoundElementsUris } = require('controllers/listings/lib/helpers')
const { tap } = require('lib/promises')
const getEntitiesByUris = require('controllers/entities/lib/get_entities_by_uris')

const listings_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
  byCreators: ids => db.viewByKeys('byCreator', ids),
  byIdsWithElements: async (ids, userId) => {
    const listings = await listings_.byIds(ids)
    if (!_.isNonEmptyArray(listings)) return []
    const listingIds = listings.map(_.property('_id'))
    const elements = await elements_.byListings(listingIds, userId)
    if (!_.isNonEmptyArray(listings)) return []
    const elementsByListing = _.groupBy(elements, 'list')
    listings.forEach(assignElementsToListing(elementsByListing))
    return listings
  },
  create: async params => {
    const listing = Listing.create(params)
    const invalidGroupId = await validateVisibilityKeys(listing.visibility, listing.creator)
    if (invalidGroupId) {
      throw error_.new('list creator is not in that group', 400, {
        visibilityKeys: listing.visibility,
        groupId: invalidGroupId
      })
    }
    return db.postAndReturn(listing)
  },
  updateAttributes: async params => {
    const { id, reqUserId } = params
    const newAttributes = _.pick(params, updateAttributes)
    if (newAttributes.visibility) {
      await validateVisibilityKeys(newAttributes.visibility, reqUserId)
    }
    const listing = await db.get(id)
    const updatedList = Listing.updateAttributes(listing, newAttributes, reqUserId)
    return db.putAndReturn(updatedList)
  },
  bulkDelete: db.bulkDelete,
  addElements: async ({ listing, uris, userId }) => {
    const currentElements = listing.elements
    const { foundElements, notFoundUris } = filterFoundElementsUris(currentElements, uris)
    await validateExistingEntities(notFoundUris)
    const { docs: createdElements } = await elements_.create({ uris: notFoundUris, listing, userId })
    if (_.isNonEmptyArray(foundElements)) {
      return { ok: true, alreadyInList: foundElements, createdElements }
    }
    return { ok: true, createdElements }
  },
  validateOwnership: (userId, listings) => {
    listings = _.forceArray(listings)
    for (const listing of listings) {
      if (listing.creator !== userId) {
        throw error_.new('wrong user', 403, { userId, listId: listing._id })
      }
    }
  },
  getListingWithElements: async (listingId, userId) => {
    const listings = await listings_.byIdsWithElements(listingId, userId)
    return listings[0]
  },
  deleteUserListingsAndElements: userId => {
    return listings_.byCreators([ userId ])
    .then(tap(elements_.deleteListingsElements))
    .then(db.bulkDelete)
  },
}

const assignElementsToListing = elementsByListing => listing => {
  listing.elements = elementsByListing[listing._id] || []
}

const validateExistingEntities = async uris => {
  const { notFound } = await getEntitiesByUris({ uris })
  if (_.isNonEmptyArray(notFound)) {
    throw error_.new('entities not found', 403, { uris: notFound })
  }
}
