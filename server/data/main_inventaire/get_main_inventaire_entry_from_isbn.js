const { fixedEncodeURIComponent } = require('lib/utils/url')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const wdIdByIso6392Code = require('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')
const wmCodeByIso6392Code = require('wikidata-lang/mappings/wm_code_by_iso_639_2_code.json')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const { parseSameasMatches } = require('data/lib/external_ids')
const { buildEntryFromFormattedRows } = require('data/lib/build_entry_from_formatted_rows')
const { setEditionPublisherClaim } = require('data/lib/set_edition_publisher_claim')
const { formatAuthorName } = require('data/commons/format_author_name')
const { parse } = require('node-html-parser')
// Using a shorter timeout as the query is never critically needed but can make a user wait
const timeout = 10000

const headers = { accept: '*/*' }
const base = `https://inventaire.io/entity/isbn:`
//https://inventaire.io/entity/isbn:9781591162346

module.exports = async isbn => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { isbn10h, isbn13h, isbn13 } = isbnData
  const headers = { "User-Agent": "curl"}
  const url = base + isbn13

  console.log("jola " + url)
  //const response = await fetch(url, { headers: { "User-Agent": "curl"}})
  //const body = await response.text()
  //console.log(body)

  const response = await requests_.get(url, { headers: headers, parseJson: false })
  const root = parse(response)
  
  const title = root.querySelector('#main .top-section h2').text
  const authors = root.querySelectorAll('#main .author-label')
  const cover = "https://inventaire.io" + root.querySelector('#main .top-section .cover img').attrs.src

  pubDate = null
  publisher = null
  edition = null
  language = null

  // Claims
  for (elem of root.querySelectorAll('#main .claim')) {
    const key = elem.firstChild.text.trim()
    const value = elem.lastChild.text.trim()
    if (key == 'date of publication:') {
      pubDate = value
    }
    if (key == 'publisher:') {
      publisher = value
    }
    if (key == 'edition of:') {
      edition = value
    }
    if (key == 'language:') {
      language = value
    }
  }

  console.log(title + " " + pubDate + " " + publisher + " " +  edition + " " +  language + " " + cover)

  const conv = {French: "fre", English: "eng"}
  expressionLang = conv[language]
  console.log("expr " + language + " " + expressionLang)
  labelLang = wmCodeByIso6392Code[expressionLang]
  const entry = { 
    edition: { 
      isbn: isbn13, 
      claims: { 
        'wdt:P1476': [ title ],
        'wdt:P407': [ prefixifyWd(wdIdByIso6392Code[expressionLang]) ]
      }, 
      image: cover, 
      labels: {}
    }, 
    works: [{labels: { [labelLang]: title }, claims: {}}], 
    authors: []
  }


  for (auth of authors) {
    entry.authors.push({uri: undefined, claims: {}, labels: { [labelLang]: auth.text}})
  }
 
  if (pubDate) {
    entry.edition.claims['wdt:P577'] = [ pubDate ] 
  }
  if (publisher) {
    entry.publisher = {
      labels: { [labelLang]: publisher }
    }
  }
  console.log(entry)
  //throw new Error(`meooow invalid isbn: ${isbn}`)

  return entry
}

const getSourceId = entity => entity.claims?.['wdt:P268'] || entity.tempBnfId || entity.labels?.fr

const addImage = async entry => {
  const bnfId = entry?.edition.claims['wdt:P268']
  if (!bnfId) return
  const url = `https://catalogue.bnf.fr/couverture?appName=NE&idArk=ark:/12148/cb${bnfId}&couverture=1`
  const { statusCode, headers } = await requests_.head(url)
  let { 'content-length': contentLength } = headers
  if (contentLength) contentLength = parseInt(contentLength)
  if (statusCode === 200 && !placeholderContentLengths.includes(contentLength)) {
    entry.edition.image = url
  }
}

const placeholderContentLengths = [
  4566,
  4658,
]
