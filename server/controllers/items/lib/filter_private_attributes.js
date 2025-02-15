const { private: privateAttributes } = require('models/item').attributes
const privateAttributesUtilsFactory = require('lib/private_attributes_utils_factory')

const { omitPrivateAttributes, filterPrivateAttributes } = privateAttributesUtilsFactory(privateAttributes)

module.exports = {
  omitPrivateAttributes,
  filterPrivateAttributes,
}
