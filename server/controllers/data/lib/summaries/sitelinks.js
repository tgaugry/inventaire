const { getSitelinkData, getSitelinkUrl } = require('wikidata-sdk')

const getWikipediaSitelinksData = sitelinks => {
  if (!sitelinks) return []
  return Object.entries(sitelinks).map(getWikipediaSummaryData)
}

const getWikipediaSummaryData = ([ key, title ]) => {
  const { lang, project } = getSitelinkData(key)
  if (project === 'wikipedia') {
    const link = getSitelinkUrl({ site: key, title })
    return {
      key,
      name: `Wikipedia (${lang})`,
      lang,
      link,
      sitelink: {
        title,
        lang,
      },
    }
  }
}
module.exports = {
  getWikipediaSitelinksData,
}
