import assert from 'assert'
import * as Index from '../src/index'

describe('index', () => {
  it('has the necessary exports', () => {
    assert.ok(Index.encryptSecret, 'Index contains encryptSecret')
    assert.ok(Index.spokestackMiddleware, 'Index contains spokestackMiddleware')
    assert.ok(Index.googleASRSocketServer, 'Index contains googleASRSocketServer')
    assert.ok(Index.googleASR, 'Index contains googleASR')
  })
})
