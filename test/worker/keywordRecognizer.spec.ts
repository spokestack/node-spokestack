import assert from 'assert'
import KeywordRecognizer from '../../src/worker/processors/keyword'
import { SpeechConfig } from '../../src/client/types'

describe('keyword recognizer', () => {
  const config: SpeechConfig = {
    sampleRate: 16000,
    fftWidth: 512,
    hopLength: 10
  }

  it('fails to create without model URL', function (done) {
    config.keywordClasses = ['foo']
    assert
      .rejects(() => KeywordRecognizer.create(config), { message: 'keyword URL required' })
      .then(done)
  })
  it('fails to create without keyword classes', function (done) {
    config.baseKeywordUrl = 'https://spokestack.io'
    config.keywordClasses = undefined
    assert
      .rejects(() => KeywordRecognizer.create(config), { message: 'keyword classes required' })
      .then(done)
  })
  it('fails to create with empty keyword classes', function (done) {
    config.baseKeywordUrl = 'https://spokestack.io'
    config.keywordClasses = []
    assert
      .rejects(() => KeywordRecognizer.create(config), { message: 'keyword classes required' })
      .then(done)
  })
})
