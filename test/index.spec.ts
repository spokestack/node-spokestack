import * as Index from '../src/index'

import assert from 'assert'

describe('index', () => {
  it('has the necessary exports', () => {
    assert.ok(Index.encryptSecret, 'Index contains encryptSecret')
    assert.ok(Index.spokestackMiddleware, 'Index contains spokestackMiddleware')
    assert.ok(Index.asrSocketServer, 'Index contains asrSocketServer')
    assert.ok(Index.googleASRSocketServer, 'Index contains googleASRSocketServer')
    assert.ok(Index.asr, 'Index contains asr')
    assert.ok(Index.googleASR, 'Index contains googleASR')
    assert.ok(Index.spokestackASRService, 'Index contains spokestackASRService')
  })
})
