require('should')
const { publicReq, shouldNotBeCalled } = require('../utils/utils')
const slugify = require('controllers/groups/lib/slugify')
const endpoint = '/api/groups?action=slug'

describe('groups:get:slug', () => {
  it('should reject without name', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: name')
    })
  })

  it('should return a slug', async () => {
    const name = 'he"ll_oa% $ az}d a"\'z a(ù]ùd azd'
    const encodedName = encodeURIComponent(name)
    const { slug } = await publicReq('get', `${endpoint}&name=${encodedName}`)
    slug.should.equal(slugify(name))
  })
})
