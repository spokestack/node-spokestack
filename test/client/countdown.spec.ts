import assert from 'assert'
import sinon from 'sinon'
import countdown from '../../src/client/countdown'

describe('countdown', () => {
  let clock: sinon.SinonFakeTimers
  beforeEach(function () {
    clock = sinon.useFakeTimers()
  })
  afterEach(function () {
    clock.restore()
  })

  it('counts down from two', function (done) {
    this.timeout(3000)
    let remaining: number
    countdown(
      2,
      (r) => (remaining = r),
      () => {
        assert.equal(remaining, 0)
        done()
      }
    )
    clock.tick(1000)
    clock.tick(1000)
  })
})
