import assert from 'assert'
import convertFloat32ToInt16 from '../../src/client/convertFloat32ToInt16'

describe('convertFloat32ToInt16', () => {
  it('maps over every value', function () {
    assert.deepEqual(
      convertFloat32ToInt16(new Float32Array([1, 2, 3, 4])),
      new Int16Array([32767, -2, 32765, -4])
    )
  })
})
