const CONFIG = require('config')
const __ = CONFIG.universalPath
const { wait } = __.require('lib', 'promises')
require('should')
const { checkFrequency, ttl } = CONFIG.entitiesRelationsTemporaryCache

const { someFakeUri } = __.require('apiTests', 'fixtures/entities')
const { get, set, del } = __.require('controllers', 'entities/lib/entities_relations_temporary_cache')

const property = 'wdt:P50'
const targetEntityUri = 'wd:Q1'

describe('entities relations temporary cache', () => {
  beforeEach(async () => {
    await del(someFakeUri, property, targetEntityUri)
  })

  it('should store a relation', async () => {
    await set(someFakeUri, property, targetEntityUri)
    const subjects = await get(property, targetEntityUri)
    subjects.should.containEql(someFakeUri)
  })

  it('should delete a relation after the ttl expired', async function () {
    const delay = ttl + checkFrequency
    this.timeout(5000 + delay)
    await set(someFakeUri, property, targetEntityUri)
    const subjects = await get(property, targetEntityUri)
    subjects.should.containEql(someFakeUri)
    await wait(delay)
    const refreshedSubjects = await get(property, targetEntityUri)
    refreshedSubjects.should.not.containEql(someFakeUri)
  })
})
