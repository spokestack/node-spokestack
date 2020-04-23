import assert from 'assert'
import * as Client from '../src/client'

describe('client', () => {
  it('has the necessary exports', () => {
    assert.ok(Client.convertFloat32ToInt16, 'Client contains convertFloat32ToInt16')
    assert.ok(Client.record, 'Client contains record')
    assert.ok(Client.startStream, 'Client contains startStream')
    assert.ok(Client.stopStream, 'Client contains stopStream')
  })
})
