const _ = require('builders/utils')
const { get } = require('lib/requests')
const { wait } = require('lib/promises')
const { origin: elasticOrigin } = require('config').elasticsearch
const { indexesList, syncIndexesList } = require('db/elasticsearch/indexes')
const createIndex = require('./create_index')
const reindexOnChange = require('./reindex_on_change')

module.exports = async () => {
  await waitForElastic()
  await ensureIndexesExist()
  startCouchElasticSync()
}

const ensureIndexesExist = () => {
  return Promise.all(indexesList.map(ensureIndexExists))
}

const ensureIndexExists = index => {
  const indexUrl = `${elasticOrigin}/${index}`
  return get(indexUrl)
  .catch(err => {
    if (err.statusCode === 404) return createIndex(index)
    else throw err
  })
}

const waitForElastic = async () => {
  try {
    await get(elasticOrigin)
  } catch (err) {
    if (err.statusCode === 503 || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      _.warn(`waiting for Elasticsearch on ${elasticOrigin}`)
      await wait(500)
      return waitForElastic()
    } else {
      throw err
    }
  }
}

const startCouchElasticSync = () => {
  syncIndexesList.forEach(reindexOnChange)
}
