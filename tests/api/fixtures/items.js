const _ = require('builders/utils')
const fakeText = require('./text')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createEdition, createEditionWithWorkAndAuthor, createEditionWithWorkAuthorAndSerie } = require('./entities')

const getEditionUri = async (lang = 'en') => {
  const { uri } = await createEdition({ lang })
  return uri
}

const createItemWithEntities = createEntityFn => async (user, itemData = {}) => {
  const { uri } = await createEntityFn()
  itemData.entity = uri
  return API.createItem(user, itemData)
}

const API = module.exports = {
  createItems: async (user, itemsData = []) => {
    user = user || getUser()
    const items = await Promise.all(itemsData.map(addDefaultEntity))
    return customAuthReq(user, 'post', '/api/items', items)
  },

  createItem: async (user, itemData) => {
    user = user || getUser()
    itemData = itemData || {}
    itemData.visibility = itemData.visibility || [ 'public' ]
    await addDefaultEntity(itemData)
    const [ item ] = await customAuthReq(user, 'post', '/api/items', [ itemData ])
    return item
  },

  createRandomizedItems: (user, itemsData) => {
    return API.createItems(user, itemsData.map(fillItemWithRandomData))
  },

  createItemWithEditionAndWork: createItemWithEntities(createEdition),
  createItemWithAuthor: createItemWithEntities(createEditionWithWorkAndAuthor),
  createItemWithAuthorAndSerie: createItemWithEntities(createEditionWithWorkAuthorAndSerie)
}

const transactions = [ 'giving', 'lending', 'selling', 'inventorying' ]
const someVisibilityValues = [
  [],
  [ 'friends' ],
  [ 'groups' ],
  [ 'friends', 'groups' ],
  [ 'public' ],
]

const fillItemWithRandomData = (itemData = {}) => {
  itemData.visibility = itemData.visibility || _.sample(someVisibilityValues)
  itemData.transaction = itemData.transaction || _.sample(transactions)
  itemData.details = fakeText.sentence()
  itemData.notes = fakeText.sentence()
  return itemData
}

const addDefaultEntity = async itemData => {
  if (!itemData.entity) {
    const entity = itemData[0] && itemData[0].entity
    const entityUri = await (entity || getEditionUri())
    itemData.entity = entityUri
  }
  return itemData
}
