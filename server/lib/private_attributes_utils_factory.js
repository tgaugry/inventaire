const { omit } = require('lodash')

module.exports = privateAttributes => {
  const omitPrivateAttributes = doc => omit(doc, privateAttributes)

  return {
    omitPrivateAttributes,

    filterPrivateAttributes: reqUserId => doc => {
      if (doc.owner === reqUserId) return doc
      else return omitPrivateAttributes(doc)
    }
  }
}
