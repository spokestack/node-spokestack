/**
 * A utility method to concatenate two AudioBuffers
 */
export default function concatenateAudioBuffers(
  buffer1: AudioBuffer,
  buffer2: AudioBuffer,
  context: AudioContext
) {
  if (!buffer1 || !buffer2) {
    console.log('no buffers!')
    return null
  }

  if (buffer1.numberOfChannels != buffer2.numberOfChannels) {
    console.log('number of channels is not the same!')
    return null
  }

  if (buffer1.sampleRate != buffer2.sampleRate) {
    console.log("sample rates don't match!")
    return null
  }

  const tmp = context.createBuffer(
    buffer1.numberOfChannels,
    buffer1.length + buffer2.length,
    buffer1.sampleRate
  )

  for (let i = 0; i < tmp.numberOfChannels; i++) {
    const data = tmp.getChannelData(i)
    data.set(buffer1.getChannelData(i))
    data.set(buffer2.getChannelData(i), buffer1.length)
  }
  return tmp
}
