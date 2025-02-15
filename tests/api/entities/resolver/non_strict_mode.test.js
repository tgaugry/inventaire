require('should')
const { authReq } = require('tests/api/utils/utils')
const { randomLabel, generateIsbn13 } = require('tests/api/fixtures/entities')

describe('entities:resolve:non-strict mode', () => {
  it('should ignore and report sanitization errors (invalid isbn)', async () => {
    const entry = { edition: { isbn: '978000000000' } }
    const res = await authReq('post', '/api/entities?action=resolve', { entries: [ entry ], strict: false })
    res.entries.should.deepEqual([])
    res.errors.should.be.an.Array()
    res.errors[0].message.should.equal('invalid isbn')
    res.errors[0].entry.should.be.an.Object()
  })

  it('should ignore and report sanitization errors (empty entry)', async () => {
    const entry = { edition: {} }
    const res = await authReq('post', '/api/entities?action=resolve', { entries: [ entry ], strict: false })
    res.errors.should.be.an.Array()
    res.errors[0].message.should.equal('either edition or works should not be empty')
    res.errors[0].entry.should.be.an.Object()
  })

  it('should ignore and report create errors', async () => {
    const entry = {
      edition: {
        isbn: generateIsbn13(),
        claims: { 'wdt:P1476': [ randomLabel() ] }
      },
      works: [ {} ]
    }
    const res = await authReq('post', '/api/entities?action=resolve', { entries: [ entry ], create: true, strict: false })
    res.entries.should.deepEqual([])
    res.errors.should.be.an.Array()
    res.errors[0].message.should.equal('invalid labels')
    res.errors[0].entry.should.be.an.Object()
  })
})
