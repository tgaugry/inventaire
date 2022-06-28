const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const timeout = 10 * 1000
const { fixedEncodeURIComponent } = require('lib/utils/url')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify

const summaryGettersByClaimProperty = {
  'wdt:P268': async claimValues => {
    const id = claimValues[0]
    const sparql = `SELECT * {
      <http://data.bnf.fr/ark:/12148/cb${id}#about> <http://purl.org/dc/terms/abstract> ?summary .
    }`
    const source = 'wdt:P268'
    const headers = { accept: '*/*' }
    const url = `https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=${timeout}&query=${fixedEncodeURIComponent(sparql)}`
    const text = await cache_.get({
      key: `summary:${source}:${id}`,
      fn: async () => {
        const response = await requests_.get(url, { headers, timeout })
        const simplifiedResults = simplifySparqlResults(response)
        return simplifiedResults[0]?.summary
      }
    })
    if (text) return { source, text }
  },
  'wdt:P648': async claimValues => {
    const id = claimValues[0]
    const url = `https://openlibrary.org/works/${id}.json`
    const source = 'wdt:P648'
    const text = await cache_.get({
      key: `summary:${source}:${id}`,
      fn: async () => {
        const { description } = await requests_.get(url, { timeout })
        if (!description) return
        if (description.value) return description.value
        else if (typeof description === 'string') return description
      }
    })
    if (text) return { source, text }
  }
}

const propertiesWithGetters = Object.keys(summaryGettersByClaimProperty)

module.exports = {
  summaryGettersByClaimProperty,
  propertiesWithGetters,
}
