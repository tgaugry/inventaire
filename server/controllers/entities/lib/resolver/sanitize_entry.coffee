CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
properties = require '../properties/properties_values_constraints'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
isbn_ = __.require 'lib', 'isbn/isbn'

# Validate and format
module.exports = (res)-> (entry)->
  { edition, works, authors } = entry
  sanitizeCollection res, entry, 'edition'
  sanitizeCollection res, entry, 'works'
  sanitizeCollection res, entry, 'authors'
  return entry

sanitizeCollection = (res, entry, name)->
  collection = entry[name] ?= []
  collection.forEach (entity)->
    if name is 'edition' then sanitizeEdition(entity)
    sanitizeEntityDraft res, entity, name

sanitizeEdition = (edition)->
  rawIsbn = getIsbn(edition)

  unless rawIsbn
    throw error_.new 'no isbn found', 400, edition

  isbn = isbn_.normalizeIsbn(rawIsbn)
  if isbn and not isbn_.isValidIsbn(isbn)
    throw error_.new 'invalid isbn', 400, { edition }

  edition.isbn = isbn

sanitizeEntityDraft = (res, entity, name)->
  entity.labels ?= {}
  unless _.isPlainObject entity.labels
    throw error_.new 'invalid labels', 400, { entity }

  entity.claims ?= {}
  unless _.isPlainObject entity.claims
    throw error_.new 'invalid claims', 400, { entity }

  sanitizeClaims res, entity.claims

sanitizeClaims = (res, claims)->
  Object.keys(claims).forEach (prop)->
    unless properties[prop]?
      responses_.addWarning res, 'resolver', "unknown property: #{prop}"
      delete claims[prop]
    claims[prop] = _.forceArray claims[prop]

getIsbn = (edition)->
  if edition.isbn then return edition.isbn
  if edition.claims and edition.claims['wdt:P212'] then edition.claims['wdt:P212']
