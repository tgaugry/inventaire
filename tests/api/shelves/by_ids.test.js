const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { publicReq, authReq, authReqB, getUser, customAuthReq } = require('../utils/utils')
const { createUser } = require('../fixtures/users')
const { createShelf } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')
const { makeFriends } = require('../utils/relations')
const { createGroupWithAMember } = require('tests/api/fixtures/groups')
const { someCouchUuid } = require('tests/api/fixtures/general')

const endpoint = '/api/shelves?action=by-ids'

describe('shelves:by-ids', () => {
  it('should reject without ids', async () => {
    try {
      await authReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should be empty when the id does not exist', async () => {
    await authReqB('get', `${endpoint}&ids=${someCouchUuid}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
    })
  })

  it('should get a public shelf', async () => {
    const { shelf } = await createShelf()
    shelf.visibility.should.deepEqual([ 'public' ])
    const { shelves } = await publicReq('get', `${endpoint}&ids=${shelf._id}`)
    shelves[shelf._id].should.be.an.Object()
  })

  it('should not return non friends network shelves', async () => {
    const { shelf } = await createShelf(null, { visibility: [] })
    await authReqB('get', `${endpoint}&ids=${shelf._id}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  it('should return owner private shelves', async () => {
    const { shelf } = await createShelf(null, { visibility: [] })
    const res = await authReq('get', `${endpoint}&ids=${shelf._id}`)
    const resIds = Object.keys(res.shelves)
    resIds.should.containEql(shelf._id)
  })

  it('should not return a private shelf to an authentified user', async () => {
    const { shelf } = await createShelf(null, { visibility: [] })
    await authReqB('get', `${endpoint}&ids=${shelf._id}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  it('should not return a private shelf to a non-authentified user', async () => {
    const { shelf } = await createShelf(null, { visibility: [] })
    await publicReq('get', `${endpoint}&ids=${shelf._id}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })

  it('should set warnings when some requested shelves can not be returned', async () => {
    const [ { shelf: privateShelf }, { shelf: publicShelf } ] = await Promise.all([
      createShelf(null, { visibility: [] }),
      createShelf(null, { visibility: [ 'public' ] }),
    ])
    const ids = [ someCouchUuid, privateShelf._id, publicShelf._id ]
    const res = await publicReq('get', `${endpoint}&ids=${ids.join('|')}`)
    Object.keys(res.shelves).should.deepEqual([ publicShelf._id ])
    res.warnings.should.containEql(`shelves not found: ${someCouchUuid}`)
    res.warnings.should.containEql(`unauthorized shelves access: ${privateShelf._id}`)
  })

  it('should not return network shelves', async () => {
    const userA = await createUser()
    const userB = await createUser()
    const { shelf } = await createShelf(userB, { visibility: [ 'network' ] })
    await customAuthReq(userA, 'get', `${endpoint}&ids=${shelf._id}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  it('should return friends network shelves', async () => {
    const friend = await createUser()
    const user = await getUser()
    await makeFriends(friend, user)
    const { shelf } = await createShelf(null, { visibility: [ 'network' ] })
    const res = await customAuthReq(friend, 'get', `${endpoint}&ids=${shelf._id}`)
    const resIds = Object.keys(res.shelves)
    resIds.should.containEql(shelf._id)
  })

  it('should not return friends private shelves', async () => {
    const friend = await createUser()
    const user = await getUser()
    await makeFriends(friend, user)
    const { shelf } = await createShelf(null, { visibility: [] })
    await customAuthReq(friend, 'get', `${endpoint}&ids=${shelf._id}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  it('should return a group-allowed shelf to a group member', async () => {
    const { group, member: memberA, admin: memberB } = await createGroupWithAMember()
    const { shelf } = await createShelf(memberA, { visibility: [ `group:${group._id}` ] })
    const res = await customAuthReq(memberB, 'get', `${endpoint}&ids=${shelf._id}`)
    const resIds = Object.keys(res.shelves)
    resIds.should.containEql(shelf._id)
  })

  it('should not return a group-allowed shelf to a friend', async () => {
    const user = await createUser()
    const { group, member } = await createGroupWithAMember()
    const { shelf } = await createShelf(member, { visibility: [ `group:${group._id}` ] })
    await customAuthReq(user, 'get', `${endpoint}&ids=${shelf._id}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  describe('with-items', () => {
    it('should get shelves items when passing with-items params', async () => {
      const { shelf } = await createShelf()
      const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
      Object.values(res.shelves)[0].items.should.be.an.Array()
    })

    describe('public shelf', () => {
      it('should get public items', async () => {
        const item = await createItem(getUser(), { listing: 'public' })
        const { shelf } = await createShelf()
        await addItem(shelf._id, item._id)
        const res = await authReqB('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = Object.values(res.shelves)[0]
        resShelf.items.should.containEql(item._id)
      })

      it('should not get network items', async () => {
        const userA = await createUser()
        const userB = await createUser()
        const item = await createItem(userA, { listing: 'network' })
        const { shelf } = await createShelf(userA)
        await addItem(shelf._id, item._id, userA)
        const res = await customAuthReq(userB, 'get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = Object.values(res.shelves)[0]
        resShelf.items.should.not.containEql(item._id)
      })

      it('should not get private items', async () => {
        const item = await createItem(getUser(), { listing: 'private' })
        const { shelf } = await createShelf()
        await addItem(shelf._id, item._id)
        const res = await authReqB('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = Object.values(res.shelves)[0]
        resShelf.items.should.not.containEql(item._id)
      })
    })

    describe('network shelf', () => {
      it('should not get private items', async () => {
        const friend = await createUser()
        const user = await getUser()
        await makeFriends(friend, user)
        const item = await createItem(friend, { listing: 'private' })
        const { shelf } = await createShelf(friend, { visibility: [ 'network' ] })
        await addItem(shelf._id, item._id, friend)
        const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = Object.values(res.shelves)[0]
        resShelf.items.should.not.containEql(item._id)
      })

      it('should get network items', async () => {
        const friend = await createUser()
        const user = await getUser()
        await makeFriends(friend, user)
        const item = await createItem(friend, { listing: 'network' })
        const { shelf } = await createShelf(friend, { visibility: [ 'network' ] })
        await addItem(shelf._id, item._id, friend)
        const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = Object.values(res.shelves)[0]
        resShelf.items.should.containEql(item._id)
      })

      it('should get public items', async () => {
        const friend = await createUser()
        const item = await createItem(friend)
        const { shelf } = await createShelf(friend, { visibility: [ 'network' ] })
        await addItem(shelf._id, item._id, friend)
        const user = await getUser()
        await makeFriends(friend, user)
        const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = Object.values(res.shelves)[0]
        resShelf.items.should.containEql(item._id)
      })
    })
  })
})

const addItem = async (shelfId, itemId, userPromise) => {
  if (!userPromise) userPromise = getUser()
  return customAuthReq(userPromise, 'post', '/api/shelves?action=add-items', {
    id: shelfId,
    items: [ itemId ]
  })
}
