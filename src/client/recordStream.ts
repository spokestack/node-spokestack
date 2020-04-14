import { ProcessorReturnValue, startProcessor, stopProcessor } from './processor'

import convertFloat32ToInt16 from './convertFloat32ToInt16'
import { setCookie } from '../cookies'

let stop: (() => void) | undefined

/**
 * Returns a function to stop recording
 * @param isPlaying A function returning whether audio is currently playing.
 *   This is necessary to prevent recording played audio.
 */
export async function startStream(isPlaying: () => boolean) {
  const [error, result] = await startProcessor()
  if (error) {
    throw error
  }
  const { context, processor } = result as ProcessorReturnValue
  const address = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}${
    location.port ? `:${location.port}` : ''
  }`
  console.log(address)

  const ws = new WebSocket(address)
  setCookie('sampleRate', context.sampleRate + '')

  function sendChannelData(e: AudioProcessingEvent) {
    // Do nothing if we're playing audio
    if (isPlaying()) {
      return
    }
    ws.send(convertFloat32ToInt16(e.inputBuffer.getChannelData(0)))
  }

  ws.addEventListener('open', () => {
    processor.addEventListener('audioprocess', sendChannelData)
  })

  stop = function stopStream() {
    processor.removeEventListener('audioprocess', sendChannelData)
    ws.close()
    return stopProcessor()
  }

  return ws
}

export function stopStream() {
  if (stop) {
    stop()
  }
  stop = undefined
}
