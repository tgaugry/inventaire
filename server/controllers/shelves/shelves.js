const ActionsControllers = require('lib/actions_controllers')
const { addItems, removeItems } = require('./items_actions')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-ids': require('./by_ids'),
      'by-owners': require('./by_owners')
    }
  }),
  post: ActionsControllers({
    authentified: {
      create: require('./create'),
      // TODO: harmonize with other endpoints to have 'update'
      // and assimilated actions use the PUT verb
      update: require('./update'),
      'add-items': addItems,
      'remove-items': removeItems,
      delete: require('./delete_by_ids')
    }
  })
}
