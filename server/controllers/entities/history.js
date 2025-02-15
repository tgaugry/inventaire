// An endpoint to get entities history as snapshots and diffs
const patches_ = require('./lib/patches/patches')
const { hasAdminAccess } = require('lib/user_access_levels')
const anonymizePatches = require('./lib/anonymize_patches')

const sanitization = {
  id: {}
}

const controller = async (params, req) => {
  const { id, reqUserId } = params
  const patches = await patches_.getWithSnapshots(id)
  if (!hasAdminAccess(req.user)) await anonymizePatches({ patches, reqUserId })
  return { patches }
}

module.exports = { sanitization, controller }
