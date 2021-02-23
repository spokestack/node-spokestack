import assert from 'assert'
import WakewordTrigger from '../../src/worker/processors/wakeword'

describe('wakeword trigger', () => {
  it('fails to create without model URL', function (done) {
    const config = {
      sampleRate: 16000,
      fftWidth: 512,
      hopLength: 10
    }
    assert
      .rejects(() => WakewordTrigger.create(config), { message: 'wakeword URL required' })
      .then(done)
  })
})
