import assert from 'assert'
import encryptSecret from '../../src/server/encryptSecret'

describe('encryptSecret', () => {
  it('throws an error if clientSecret is not passed', () => {
    assert.throws(() => {
      encryptSecret('1234', '')
    })
  })
  it('properly encodes a body with the given secret', () => {
    const encoded = encryptSecret(JSON.stringify({ query: '{}' }), '1234')
    assert.equal(encoded, 'W3Umy6IGO5GYwQsVCzbBEDPhzHRl3I7NzGcToYkOSU8=')
  })
})
