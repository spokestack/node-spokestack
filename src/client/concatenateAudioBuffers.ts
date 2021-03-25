/**
 * A utility method to concatenate two AudioBuffers
 */
export default function concatenateAudioBuffers(
  buffer1: AudioBuffer | null,
  buffer2: AudioBuffer | null,
  context: AudioContext
) {
  if (!buffer1 && !buffer2) {
    console.error('Pass at least one buffer')
    return null
  }

  if (buffer1 && !buffer2) {
    return buffer1
  }

  if (buffer2 && !buffer1) {
    return buffer2
  }

  const b1 = buffer1 as AudioBuffer
  const b2 = buffer2 as AudioBuffer

  if (b1.numberOfChannels !== b2.numberOfChannels) {
    console.log('Number of channels is not the same!')
    return null
  }

  if (b1.sampleRate !== b2.sampleRate) {
    console.log("Sample rates don't match!")
    return null
  }

  const tmp = context.createBuffer(b1.numberOfChannels, b1.length + b2.length, b1.sampleRate)

  for (let i = 0; i < tmp.numberOfChannels; i++) {
    const data = tmp.getChannelData(i)
    data.set(b1.getChannelData(i))
    data.set(b2.getChannelData(i), b1.length)
  }
  return tmp
}
