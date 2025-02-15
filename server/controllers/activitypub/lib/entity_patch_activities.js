const _ = require('builders/utils')
const { postActivityToActorFollowersInboxes } = require('./post_activity')
const formatEntityPatchesActivities = require('./format_entity_patches_activities')

const deliverEntityActivitiesFromPatch = async patch => {
  try {
    const activities = await getActivitiesFromPatch(patch)
    if (activities.length === 0) return
    await Promise.all(activities.map(activity => {
      const actorName = new URL(activity.actor).searchParams.get('name')
      return postActivityToActorFollowersInboxes({ activity, actorName })
    }))
  } catch (err) {
    _.error(err, 'create_activities_on_entities_updates err')
  }
}

const getActivitiesFromPatch = async patch => {
  const rows = byClaimValueAndDate(patch)
  if (rows.length === 0) return []
  return formatEntityPatchesActivities(rows)
}

// Mimick server/db/couchdb/design_docs/patches.json byClaimValueAndDate
const byClaimValueAndDate = doc => {
  const { _id: id, timestamp } = doc
  const rows = []
  for (const operation of doc.patch) {
    if (operation.op === 'add') {
      const [ , section, property, arrayIndex ] = operation.path.split('/')
      if (section === 'claims') {
        if (arrayIndex != null) {
          // Example case: { op: 'add', path: '/claims/wdt:P1104', value: [ 150 ] }
          addRow(rows, id, property, operation.value, timestamp)
        } else if (property != null) {
          // Example case: { op: 'add', path: '/claims/wdt:P50', value: [ 'wd:Q535' ] }
          for (const subvalue of operation.value) {
            addRow(rows, id, property, subvalue, timestamp)
          }
        }
        // Remaining case: { op: 'add', path: '/claims', value: { 'wdt:P31': [ 'wd:Q47461344' ] } }
        // Ignored as it's only accuring after a revert-merge, were add operations
        // would be dupplicates of previous add operations
      }
    }
  }
  return rows
}

const addRow = (rows, id, property, claimValue, timestamp) => {
  if (typeof claimValue === 'string' && (claimValue.startsWith('wd:') || claimValue.startsWith('inv:'))) {
    rows.push({ id, key: [ claimValue, timestamp ], value: property })
  }
}

module.exports = {
  deliverEntityActivitiesFromPatch,
  getActivitiesFromPatch,
}
