// There are no cases in the the app where we would need a higher definition than 1000px
// So using 1000px as max width and resizing from that seems acceptable for a large majority of cases
// Known exception: panoramas, but we don't use those much
const width = 1000
const { fixedEncodeURIComponent } = require('lib/utils/url')

module.exports = file => {
  if (!file) return {}

  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${fixedEncodeURIComponent(file)}?width=${width}`,
    file,
    credits: {
      text: 'Wikimedia Commons',
      url: `https://commons.wikimedia.org/wiki/File:${file}`
    }
  }
}
