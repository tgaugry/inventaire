const _ = require('builders/utils')
const error_ = require('lib/error/error')
const entities_ = require('./entities')
const Entity = require('models/entity')
const getEntityType = require('./get_entity_type')
const typeWithoutLabels = require('./type_without_labels')
const { emit } = require('lib/radio')

module.exports = async (lang, value, userId, currentDoc) => {
  checkEntityTypeCanHaveLabel(currentDoc)

  let updatedDoc = _.cloneDeep(currentDoc)
  updatedDoc = Entity.setLabel(updatedDoc, lang, value)
  const docAfterUpdate = await entities_.putUpdate({ userId, currentDoc, updatedDoc })
  await emit('entity:update:label', updatedDoc)
  return docAfterUpdate
}

const checkEntityTypeCanHaveLabel = currentDoc => {
  const type = getEntityType(currentDoc.claims['wdt:P31'])

  if (typeWithoutLabels[type]) {
    throw error_.new(`${type}s can't have labels`, 400)
  }
}
