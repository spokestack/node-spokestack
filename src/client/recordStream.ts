import { ProcessorReturnValue, startProcessor, stopProcessor } from './processor'

import convertFloat32ToInt16 from './convertFloat32ToInt16'
import { setCookie } from '../cookies'

let stop: (() => void) | undefined

interface StartStreamOptions {
  /**
   * The address (with protocol and port) of the Spokestack ASR websocket.
   * Defaults to the same domain and port as the current window location,
   * but with ws(s) as the protocol (depending on https).
   * See asrSocketServer for help creating a socket server.
   * */
  address?: string
  /**
   * A function returning whether audio is currently playing.
   * This is necessary to prevent recording played audio.
   */
  isPlaying: () => boolean
}

/**
 * Returns a function to start recording using a native WebSocket.
 * This assumes the socket is hosted on the current server.
 *
 * ```js
 * import { startStream } from 'spokestack/client'
 *
 * // ...
 * try {
 *   const [ws] = await startStream({
 *    address: 'wss://localhost:3000',
 *    isPlaying: () => this.isPlaying
 *   })
 *   ws.addEventListener('open', () => console.log('Recording started'))
 *   ws.addEventListener('close', () => console.log('Recording stopped'))
 *   ws.addEventListener('message', (e) => console.log('Speech processed: ', e.data))
 * } catch (e) {
 *   console.error(e)
 * }
 * ```
 */
export async function startStream({
  address,
  isPlaying
}: StartStreamOptions): Promise<[WebSocket, ProcessorReturnValue]> {
  if (!address) {
    address = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}${
      location.port ? `:${location.port}` : ''
    }`
  }
  const [error, result] = await startProcessor()
  if (error) {
    throw error
  }
  const { context, processor } = result as ProcessorReturnValue
  const ws = new WebSocket(address)
  setCookie('sampleRate', context.sampleRate + '')

  function sendChannelData(e: AudioProcessingEvent) {
    // Do nothing if we're playing audio
    if (isPlaying()) {
      return
    }
    if (ws.readyState === ws.OPEN) {
      ws.send(convertFloat32ToInt16(e.inputBuffer.getChannelData(0)))
    }
  }

  ws.addEventListener('open', () => {
    processor.addEventListener('audioprocess', sendChannelData)
  })

  ws.addEventListener('close', () => {
    processor.removeEventListener('audioprocess', sendChannelData)
  })

  stop = function stopStream() {
    ws.close()
    return stopProcessor()
  }
  // Close on error
  ws.addEventListener('error', stop)

  return [ws, result as ProcessorReturnValue]
}

/**
 * Stop the current recording stream if one exists.
 *
 * ```js
 * import { stopStream } from 'spokestack/client'
 * stopStream()
 * ```
 */
export function stopStream() {
  if (stop) {
    stop()
  }
  stop = undefined
}
