import * as Client from '../dist/client'
import assert from 'assert'

describe('client', () => {
  it('has the necessary exports', () => {
    assert.ok(Client.convertFloat32ToInt16, 'Client contains convertFloat32ToInt16')
    assert.ok(Client.record, 'Client contains record')
    assert.ok(Client.startStream, 'Client contains startStream')
    assert.ok(Client.stopStream, 'Client contains stopStream')
    assert.ok(Client.startPipeline, 'Client contains startPipeline')
    assert.ok(Client.stopPipeline, 'Client contains stopPipeline')
    assert.ok(Client.Stage, 'Client contains Stage')
    assert.ok(Client.SpeechPipeline, 'Client contains SpeechPipeline')
  })
})
