const _ = require('builders/utils')
const { expired } = require('lib/time')
const Shelf = require('models/shelf')
require('should')

const someUserId = '1234567890a1234567890b1234567890'
const { create, updateAttributes: update } = Shelf

const faker = require('faker')
const fakeName = faker.random.words(4)
const fakeDesc = faker.random.words(15)

const validShelf = {
  owner: someUserId,
  description: fakeDesc,
  listing: 'private',
  name: fakeName
}

const extendShelf = data => Object.assign({}, validShelf, data)

describe('shelf model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const shelf = create(validShelf)
      shelf.should.be.an.Object()
      shelf.name.should.equal(fakeName)
      shelf.description.should.equal(fakeDesc)
      shelf.owner.should.equal(someUserId)
      shelf.listing.should.equal('private')
      shelf.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      const shelf = extendShelf({ authors: 'Abel Paz' })
      const creator = () => Shelf.create(shelf)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing owner', () => {
        const invalidShelf = _.cloneDeep(validShelf)
        delete invalidShelf.owner
        const creator = () => Shelf.create(invalidShelf)
        creator.should.throw()
      })

      it('should throw on missing name', () => {
        const invalidShelf = _.cloneDeep(validShelf)
        delete invalidShelf.name
        const creator = () => Shelf.create(invalidShelf)
        creator.should.throw()
      })
    })

    describe('listing', () => {
      it('should use a default listing value', () => {
        const shelf = create(extendShelf({ listing: null }))
        shelf.listing.should.equal('private')
      })

      it('should override a bad listing with default value', () => {
        const shelf = () => create(extendShelf({ listing: 'notalist' }))
        shelf.should.throw()
      })
    })

    describe('owner', () => {
      it('should return an object with an owner', () => {
        const shelf = create(validShelf)
        shelf.owner.should.equal(someUserId)
      })
    })

    describe('created', () => {
      it('should return an object with a created time', () => {
        const shelf = create(validShelf)
        expired(shelf.created, 100).should.be.false()
      })
    })
  })

  describe('update', () => {
    it('should update when passing a valid attribute', () => {
      const shelf = create(validShelf)
      const updateAttributesData = { listing: 'public' }
      const res = update(shelf, updateAttributesData, someUserId)
      res.listing.should.equal('public')
    })

    it('should throw when passing an invalid attribute', () => {
      const doc = create(validShelf)
      const updateAttributesData = { foo: '123' }
      const updater = () => update(doc, updateAttributesData, someUserId)
      updater.should.throw('invalid attribute: foo')
    })

    it('should throw when passing an invalid attribute value', () => {
      const doc = create(validShelf)
      const updateAttributesData = { listing: 'kikken' }
      const updater = () => update(doc, updateAttributesData, someUserId)
      updater.should.throw('invalid listing: kikken')
    })
  })
})
