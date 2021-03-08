// Edge and Safari need a polyfill for MediaRecorder
// Polyfill here: https://github.com/ai/audio-recorder-polyfill
// IE has nothing and would require Silverlight or Flash to record

import { ProcessorReturnValue, startProcessor, stopProcessor } from './processor'

import concatenateAudioBuffers from './concatenateAudioBuffers'
import countdown from './countdown'

interface RecordConfig {
  /** The total time to record. Default: 3 */
  time?: number
  /** A callback function to be called when recording starts */
  onStart?: () => void
  /** A callback function to be called each second of recording. */
  onProgress?: (remaining: number) => void
}

/**
 * A method to record audio for a given number of seconds
 *
 * ```js
 * import { record } from 'spokestack/client'
 *
 * // Record for 3 seconds and return an AudioBuffer
 * const buffer = await record()
 *
 * // Record for 5 seconds, calling onProgress every second
 * const buffer = await record({
 *   time: 5,
 *   onProgress: (remaining) => {
 *     console.log(`Recording..${remaining}`)
 *   }
 * })
 *
 * // Record for 3 seconds, calling onStart when recording starts
 * // Note: recording stops when the Promise resolves
 * const buffer = await record({
 *   time: 5,
 *   onStart: () => {
 *     console.log('Recording started')
 *   }
 * })
 * ```
 *
 * Then create a file for uploading
 * See <a href="#googleASR">googleASR</a> for an example on how
 * to process the resulting audio file
 *
 * ```js
 * import { convertFloat32ToInt16 } from 'spokestack/client'
 *
 * const sampleRate = buffer.sampleRate
 * const file = new File(
 *   // Convert to LINEAR16 on the front-end instead of the server.
 *   // This took <10ms in our testing even on a slow phone.
 *   // It cuts the data over the wire to 1/4 the size.
 *   [convertFloat32ToInt16(buffer.getChannelData(0))],
 *   'recording.raw'
 * )
 * ```
 *
 * The file can then be uploaded using FormData:
 *
 * ```js
 * const formData = new FormData()
 * formData.append('sampleRate', sampleRate + '')
 * formData.append('audio', file)
 * fetch('/asr', {
 *   method: 'POST',
 *   body: formData,
 *   headers: { Accept: 'application/json' }
 * })
 *   .then((res) => {
 *     if (!res.ok) {
 *       console.log(`Response status: ${res.status}`)
 *     }
 *     return res.json()
 *   })
 *   .then(({ text }) => console.log('Processed speech', text))
 *   .catch(console.error.bind(console))
 * ```
 */
export default async function record(config: RecordConfig = { time: 3 }) {
  const { time = 3, onProgress, onStart } = config
  const [error, result] = await startProcessor()
  if (error) {
    throw error
  }

  let buffer: AudioBuffer | null
  const { processor, context } = result as ProcessorReturnValue

  function addToBuffer(e: AudioProcessingEvent) {
    buffer = concatenateAudioBuffers(buffer, e.inputBuffer, context)
  }
  processor.addEventListener('audioprocess', addToBuffer)
  if (onStart) {
    onStart()
  }

  return new Promise<AudioBuffer>((resolve, reject) => {
    countdown(
      time,
      (remaining) => {
        if (onProgress) {
          onProgress(remaining)
        }
      },
      () => {
        processor.removeEventListener('audioprocess', addToBuffer)
        stopProcessor()
        if (buffer) {
          resolve(buffer)
        } else {
          reject(
            new Error('There was a problem creating the audio buffer. Please reload and try again.')
          )
        }
      }
    )
  })
}
