const _ = require('builders/utils')
const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const { oneWeek } = require('lib/time')
const { buildUrl } = require('lib/utils/url')

module.exports = (name, endpoint, getQuery, requestOptions) => async id => {
  try {
    return await cache_.get({
      key: `${name}:author-works-titles:${id}`,
      fn: makeRequest.bind(null, endpoint, getQuery(id), requestOptions),
      ttl: oneWeek,
    })
  } catch (err) {
    _.error(err, `${name} error fetching ${id}`)
    return []
  }
}

const makeRequest = async (endpoint, query, requestOptions = {}) => {
  requestOptions.headers = { accept: 'application/sparql-results+json' }
  requestOptions.timeout = 5000
  const url = buildUrl(endpoint, { query })
  const { results } = await requests_.get(url, requestOptions)
  return results.bindings.map(parseResult)
}

const parseResult = result => ({
  title: result.title && result.title.value,
  url: result.work && result.work.value
})
