/**
 * A utility method to convert Float32Array audio
 * to an Int16Array to be passed directly to Speech APIs
 * such as Google Speech
 *
 * ```js
 * import { convertFloat32ToInt16, record } from 'spokestack/client'
 *
 * const buffer = await record()
 * const file = new File(
 *   [convertFloat32ToInt16(buffer.getChannelData(0))],
 *   'recording.raw'
 * )
 * ```
 */
export default function convertFloat32ToInt16(fp32Samples: Float32Array) {
  return new Int16Array(fp32Samples.map((value) => value * 32767))
}
