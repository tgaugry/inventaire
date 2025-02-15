const _ = require('builders/utils')
const Element = require('models/element')
require('should')

const { create } = Element

const validDocId = '12345678900987654321123456789012'
const validUri = 'inv:12345678900987654321123456789012'

const validListing = {
  uri: validUri,
  list: validDocId
}

describe('element model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const element = create(validListing)
      element.list.should.equal(validDocId)
      element.uri.should.equal(validUri)
      element.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      Object.assign({}, validListing, { foo: 'bar' })
      const creator = () => Element.create(element)
      const element = create(validListing)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing uri', () => {
        const invalidListing = _.cloneDeep(validListing)
        delete invalidListing.uri
        const creator = () => Element.create(invalidListing)
        creator.should.throw()
      })

      it('should throw on missing listing', () => {
        const invalidListing = _.cloneDeep(validListing)
        delete invalidListing.list
        const creator = () => Element.create(invalidListing)
        creator.should.throw()
      })
    })
  })
})
