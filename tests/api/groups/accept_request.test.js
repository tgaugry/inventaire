const _ = require('builders/utils')
require('should')
const { authReq, authReqC, getUserGetter, customAuthReq } = require('../utils/utils')
const { getSomeGroup, createGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=accept-request'
const { humanName } = require('../fixtures/entities')
const { shouldNotBeCalled } = require('tests/unit/utils')
const { getGroup } = require('tests/api/utils/groups')

describe('groups:update:accept-request', () => {
  it('should reject without a group', async () => {
    await authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should move requested user to members', async () => {
    const requesterPromise = getUserGetter(humanName())()
    const [ group, requester ] = await Promise.all([ getSomeGroup(), requesterPromise ])
    const { _id: requesterId } = requester
    await customAuthReq(requesterPromise, 'put', '/api/groups?action=request', { group: group._id })
    await authReq('put', endpoint, { user: requesterId, group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.members.map(_.property('user')).should.containEql(requesterId)
  })

  it('reject if not admin user', async () => {
    const group = await createGroup()
    await authReqC('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('user is not admin')
      err.statusCode.should.equal(403)
    })
  })
})
