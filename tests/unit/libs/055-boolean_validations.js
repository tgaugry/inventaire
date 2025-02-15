require('should')
const { isLocalActivityPubActorUrl } = require('lib/boolean_validations')
const { buildUrl } = require('lib/utils/url')
const host = require('config').getPublicOrigin()

describe('boolean validations', () => {
  describe('isLocalActivityPubActorUrl', () => {
    it('should reject an undefined url', () => {
      isLocalActivityPubActorUrl().should.be.false()
    })

    it('should reject a non-url', () => {
      isLocalActivityPubActorUrl('foo').should.be.false()
    })

    it('should reject a URL from another host', () => {
      const url = buildUrl('http://example.org/api/activitypub', { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url).should.be.false()
    })

    it('should reject a URL targeting another endpoint', () => {
      const url = buildUrl(`${host}/api/tests`, { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url).should.be.false()
      const url2 = buildUrl(`${host}/tests`, { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url2).should.be.false()
    })

    it('should reject a URL without a name parameter', () => {
      const url = buildUrl(`${host}/api/activitypub`, { action: 'actor', name: '' })
      isLocalActivityPubActorUrl(url).should.be.false()
    })

    it('should accept an actor URL', () => {
      const url = buildUrl(`${host}/api/activitypub`, { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url).should.be.true()
    })
  })
})
