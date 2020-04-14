// Edge and Safari need a polyfill for MediaRecorder
// Polyfill here: https://github.com/ai/audio-recorder-polyfill
// IE has nothing and would require Silverlight or Flash to record

import { ProcessorReturnValue, startProcessor, stopProcessor } from './processor'

import concatenateAudioBuffers from './concatenateAudioBuffers'
import countdown from './countdown'

interface RecordConfig {
  time?: number
  onProgress?: (remaining: number) => void
}

export default async function record({ time = 3, onProgress }: RecordConfig = { time: 3 }) {
  const [error, result] = await startProcessor()
  if (error) {
    throw error
  }

  let buffer: AudioBuffer | null
  const { processor, context } = result as ProcessorReturnValue

  function addToBuffer(e: AudioProcessingEvent) {
    buffer = buffer ? concatenateAudioBuffers(buffer, e.inputBuffer, context) : e.inputBuffer
  }
  processor.addEventListener('audioprocess', addToBuffer)

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
          reject('There was a problem creating the audio buffer. Please reload and try again.')
        }
      }
    )
  })
}
