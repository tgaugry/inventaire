const { expired } = require('lib/time')

const should = require('should')

const Item = require('models/item')
const { shouldNotBeCalled } = require('tests/unit/utils')

const someUserId = '1234567890a1234567890b1234567890'
const create = Item.create.bind(null, someUserId)
const update = Item.update.bind(null, someUserId)

const validItem = {
  entity: 'wd:Q35160',
  visibility: [ 'public' ],
  transaction: 'giving'
}

const extendItem = data => Object.assign({}, validItem, data)

describe('item model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const item = create(validItem)
      item.should.be.an.Object()
    })

    it('should throw when passed invalid attributes', () => {
      const item = extendItem({ authors: 'Joanne K. Rowling' });
      (() => create(item)).should.throw()
      const item2 = extendItem({ updated: Date.now() });
      (() => create(item2)).should.throw()
    })

    describe('id', () => {
      it('should return an object without id', () => {
        const item = create(validItem)
        should(item._id).not.be.ok()
      })
    })

    describe('entity', () => {
      it('should return an object with a entity', () => {
        const item = create(validItem)
        item.entity.should.equal(validItem.entity)
      })

      it('should throw on missing entity', () => {
        (() => create(extendItem({ entity: null }))).should.throw()
      })
    })

    describe('visibility', () => {
      it('should return an object with a visibility', () => {
        const item = create(validItem)
        item.visibility.should.deepEqual(validItem.visibility)
      })

      it('should use a default visibility value', () => {
        const item = create(extendItem({ visibility: null }))
        item.visibility.should.deepEqual([])
      })

      it('should throw on invalid visibility value', () => {
        try {
          const item = create(extendItem({ visibility: 'notalist' }))
          shouldNotBeCalled(item)
        } catch (err) {
          err.message.should.startWith('invalid visibility')
        }
      })

      it('should throw on invalid visibility element list', () => {
        try {
          const item = create(extendItem({ visibility: [ 'notalist' ] }))
          shouldNotBeCalled(item)
        } catch (err) {
          err.message.should.startWith('invalid visibility')
        }
      })
    })

    describe('transaction', () => {
      it('should return an object with a transaction', () => {
        const item = create(validItem)
        item.transaction.should.equal(validItem.transaction)
      })

      it('should override a bad transaction with default value', () => {
        const item = create(extendItem({ transaction: null }))
        item.transaction.should.equal('inventorying')
      })

      it('should throw on invalid transaction value', () => {
        const createItem = () => create(extendItem({ transaction: 'eviltransac' }))
        createItem.should.throw('invalid transaction: eviltransac')
      })
    })

    describe('owner', () => {
      it('should return an object with an owner', () => {
        const item = create(validItem)
        item.owner.should.equal(someUserId)
      })

      it('should ignore an owner passed in the data', () => {
        const item = create(extendItem({ owner: 'whatever' }))
        item.owner.should.equal(someUserId)
      })
    })

    describe('created', () => {
      it('should return an object with a created time', () => {
        const item = create(validItem)
        expired(item.created, 100).should.be.false()
      })
    })
  })

  describe('update', () => {
    it('should not throw when updated with a valid attribute', () => {
      const doc = create(validItem)
      const updateAttributesData = { visibility: [] };
      (() => update(updateAttributesData, doc)).should.not.throw()
    })

    it('should throw when updated with an invalid attribute', () => {
      const doc = create(validItem)
      const updateAttributesData = { foo: '123' };
      (() => update(updateAttributesData, doc)).should.throw('invalid attribute: foo')
    })

    it('should throw when updated with an invalid attribute value', () => {
      const doc = create(validItem)
      const updateAttributesData = { visibility: [ 'chocolat' ] };
      (() => update(updateAttributesData, doc)).should.throw()
    })
  })
})
