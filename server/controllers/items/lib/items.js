const _ = require('builders/utils')
const Item = require('models/item')
const assert_ = require('lib/utils/assert_types')
const { BasicUpdater } = require('lib/doc_updates')
const { emit } = require('lib/radio')
const { filterPrivateAttributes } = require('./filter_private_attributes')
const snapshot_ = require('./snapshot/snapshot')
const db = require('db/couchdb/base')('items')
const error_ = require('lib/error/error')
const { validateItemsAsync } = require('./validate_item_async')
const { addItemsSnapshots } = require('controllers/items/lib/queries_commons')

const items_ = module.exports = {
  db,
  byId: db.get,
  byIds: db.byIds,
  byOwner: ownerId => db.viewByKeys('byOwner', [ ownerId ]),
  byOwners: ownersIds => db.viewByKeys('byOwner', ownersIds),

  byEntity: entityUri => db.viewByKeys('byEntity', [ entityUri ]),
  byEntities: entitiesUris => db.viewByKeys('byEntity', entitiesUris),

  byOwnerAndEntities: (ownerId, entitiesUris) => {
    const keys = entitiesUris.map(uri => [ ownerId, uri ])
    return db.viewByKeys('byOwnerAndEntity', keys)
  },

  byPreviousEntity: entityUri => db.viewByKey('byPreviousEntity', entityUri),

  publicByOwnerAndDate: ({ ownerId, since, until }) => {
    assert_.string(ownerId)
    assert_.number(since)
    assert_.number(until)
    return db.viewCustom('publicByOwnerAndDate', {
      include_docs: true,
      startkey: [ ownerId, until ],
      endkey: [ ownerId, since ],
      descending: true,
    })
  },

  publicByShelfAndDate: ({ shelf, since, until }) => {
    assert_.string(shelf)
    assert_.number(since)
    assert_.number(until)
    return db.viewCustom('publicByShelfAndDate', {
      include_docs: true,
      startkey: [ shelf, until ],
      endkey: [ shelf, since ],
      descending: true,
    })
  },

  publicByDate: (limit = 15, offset = 0, assertImage = false, reqUserId) => {
    return db.viewCustom('publicByDate', {
      limit,
      skip: offset,
      descending: true,
      include_docs: true
    })
    .then(filterWithImage(assertImage))
    .then(formatItems(reqUserId))
  },

  create: async (userId, items) => {
    assert_.array(items)
    items = items.map(item => Item.create(userId, item))
    await validateItemsAsync(items)
    const res = await db.bulk(items)
    const itemsIds = _.map(res, 'id')
    const shelvesIds = _.deepCompact(_.map(items, 'shelves'))
    const [ { docs } ] = await Promise.all([
      db.fetch(itemsIds),
      emit('user:inventory:update', userId),
      emit('shelves:update', shelvesIds),
    ])
    return docs
  },

  update: async (userId, itemUpdateData) => {
    await validateItemsAsync([ itemUpdateData ])
    const currentItem = await db.get(itemUpdateData._id)
    let updatedItem = Item.update(userId, itemUpdateData, currentItem)
    updatedItem = await db.putAndReturn(updatedItem)
    await emit('user:inventory:update', userId)
    return updatedItem
  },

  setBusyness: (id, busy) => {
    assert_.string(id)
    assert_.boolean(busy)
    return db.update(id, BasicUpdater('busy', busy))
  },

  changeOwner: transacDoc => {
    const { item } = transacDoc
    return db.get(item)
    .then(Item.changeOwner.bind(null, transacDoc))
    .then(db.postAndReturn)
  },

  bulkDelete: db.bulkDelete,

  // Data serializa emails and rss feeds templates
  serializeData: async item => {
    item = await snapshot_.addToItem(item)
    const { 'entity:title': title, 'entity:authors': authors, 'entity:image': image } = item.snapshot
    item.title = title
    item.authors = authors
    if (image != null) item.pictures = [ image ]
    return item
  },

  updateShelves: async (action, shelvesIds, userId, itemsIds) => {
    const items = await items_.byIds(itemsIds)
    validateOwnership(userId, items)
    const updatedItems = items.map(item => {
      item.shelves = actionFunctions[action](item.shelves, shelvesIds)
      return item
    })
    return db.bulk(updatedItems)
  }
}

const validateOwnership = (userId, items) => {
  items = _.forceArray(items)
  for (const item of items) {
    if (item.owner !== userId) {
      throw error_.new('wrong owner', 400, { userId, itemId: item._id })
    }
  }
}

const formatItems = reqUserId => async items => {
  items = await addItemsSnapshots(items)
  return items.map(filterPrivateAttributes(reqUserId))
}

const filterWithImage = assertImage => async items => {
  items = await addItemsSnapshots(items)
  if (assertImage) return items.filter(itemWithImage)
  else return items
}

const itemWithImage = item => item.snapshot['entity:image'] != null

const actionFunctions = {
  addShelves: _.union,
  deleteShelves: _.difference
}
