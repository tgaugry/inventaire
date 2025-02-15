const should = require('should')
const { createWork, createEdition, createHuman } = require('tests/api/fixtures/entities')
const { getByUri } = require('tests/api/utils/entities')
const { publicReq, shouldNotBeCalled } = require('../utils/utils')
const requests_ = require('lib/requests')
const endpoint = '/api/data?action=summaries'

describe('summaries', () => {
  it('should reject without uri', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
    })
  })

  describe('openlibrary', () => {
    const property = 'wdt:P648'
    it('should return summaries', async () => {
      const olId = 'OL45804W'
      const work = await existsOrCreate({
        claims: {
          [property]: [ olId ]
        }
      })
      const { uri } = work
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      summaryData.key.should.equal(property)
      summaryData.text.should.startWith('The main character')
      summaryData.claim.id.should.equal(olId)
      summaryData.claim.property.should.equal(property)
      summaryData.name.should.equal('OpenLibrary')
      summaryData.link.should.equal(`https://openlibrary.org/works/${olId}`)
      summaryData.lang.should.equal('en')
    })

    it('should return empty summaries when no description is provided', async () => {
      const olId = 'OL4104668W'
      const work = await existsOrCreate({
        claims: {
          [property]: [ olId ]
        }
      })
      const { uri } = work
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      if (summaryData) {
        const url = `https://openlibrary.org/works/${olId}.json`
        const { description } = await requests_.get(url, { timeout: 10 * 1000 })
        if (description) {
          throw new Error(`This test is obsolete: the OpenLibrary response contains a description (${olId})`)
        }
      }
      should(summaryData).not.be.ok()
    })

    it('should return a summary when a bio is available', async () => {
      const olId = 'OL25712A'
      const human = await existsOrCreate({
        createFn: createHuman,
        claims: {
          [property]: [ olId ]
        }
      })
      const { uri } = human
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      summaryData.text.should.containEql('Pratchett')
    })
  })

  describe('bnf', () => {
    const property = 'wdt:P268'
    it('should return summaries', async () => {
      const bnfId = '458412245'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          [property]: [ bnfId ]
        }
      })
      const { uri } = edition
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      summaryData.key.should.equal(property)
      summaryData.claim.property.should.equal(property)
      summaryData.claim.id.should.equal(bnfId)
      summaryData.name.should.equal('BNF')
      summaryData.text.startsWith("C'est au beau milieu de la steppe")
      summaryData.link.should.equal('https://catalogue.bnf.fr/ark:/12148/cb458412245')
      summaryData.lang.should.equal('fr')
    })

    it('should not return a summary when none exists', async () => {
      const invalidBnfId = '00004444z'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          [property]: [ invalidBnfId ]
        }
      })
      const { uri } = edition
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      should(summaryData).not.be.ok()
    })
  })

  describe('wikipedia', () => {
    it('should return a reference to an available wikipedia article', async () => {
      const uri = 'wd:Q4980986'
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const svwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'svwiki')
      const enwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'enwiki')
      svwikiSitelinkData.should.deepEqual({
        key: 'svwiki',
        lang: 'sv',
        name: 'Wikipedia (sv)',
        link: 'https://sv.wikipedia.org/wiki/Liv_Str%C3%B6mquist',
        sitelink: {
          title: 'Liv Strömquist',
          lang: 'sv',
        }
      })
      enwikiSitelinkData.should.deepEqual({
        key: 'enwiki',
        lang: 'en',
        name: 'Wikipedia (en)',
        link: 'https://en.wikipedia.org/wiki/Liv_Str%C3%B6mquist',
        sitelink: {
          title: 'Liv Strömquist',
          lang: 'en',
        }
      })
    })
  })

  it('should return a tailored subset when passed langs parameters', async () => {
    const uri = 'wd:Q4980986'
    const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}&langs=sv|de`)
    const svwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'svwiki')
    const dewikiSitelinkData = summaries.find(summaryData => summaryData.key === 'dewiki')
    const enwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'enwiki')
    svwikiSitelinkData.should.be.ok()
    dewikiSitelinkData.should.be.ok()
    should(enwikiSitelinkData).not.be.ok()
  })
})

const existsOrCreate = async ({ claims, createFn = createWork }) => {
  try {
    const entity = await createFn({ claims })
    return entity
  } catch (err) {
    const existingEntityUri = err.body.context.entity
    return getByUri(existingEntityUri)
  }
}
