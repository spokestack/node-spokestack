import assert from 'assert'
import encryptSecret from '../../src/server/encryptSecret'

describe('encryptSecret', () => {
  it('throws an error if SS_API_CLIENT_SECRET is not in the environment', () => {
    assert.throws(() => {
      process.env.SS_API_CLIENT_SECRET = ''
      encryptSecret('1234')
    })
  })
  it('properly encodes a body with the given secret', () => {
    process.env.SS_API_CLIENT_SECRET = '1234'
    const encoded = encryptSecret(JSON.stringify({ query: '{}' }))
    assert.equal(encoded, 'W3Umy6IGO5GYwQsVCzbBEDPhzHRl3I7NzGcToYkOSU8=')
  })
})
