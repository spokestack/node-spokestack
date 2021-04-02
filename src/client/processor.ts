import { startRecord, stopRecord } from './mic'

let context: AudioContext | undefined
let source: MediaStreamAudioSourceNode | undefined
let processor: ScriptProcessorNode | undefined

export interface ProcessorReturnValue {
  context: AudioContext
  processor: ScriptProcessorNode
}

/**
 * Underlying utility method for recording audio,
 * used by the `record` and `recordStream` methods.
 *
 * While createScriptProcessor is deprecated, the replacement (AudioWorklet)
 * does not yet have broad support (currently only supported in Blink browsers).
 * See https://caniuse.com/#feat=mdn-api_audioworkletnode
 *
 * We'll switch to AudioWorklet when it does.
 */
export async function startProcessor(): Promise<[Error] | [null, ProcessorReturnValue]> {
  stopProcessor()
  let stream: MediaStream
  try {
    stream = await startRecord()
  } catch (e) {
    console.error(e)
    return [
      new Error(
        `There was a problem starting the microphone. ${
          navigator.__polyfilledMediaDevices
            ? 'This browser does not support microphone access.'
            : 'Please check the permission and try again.'
        }`
      )
    ]
  }
  const context = new (window.AudioContext || window.webkitAudioContext)()
  const source = context.createMediaStreamSource(stream)
  const processor = context.createScriptProcessor(1024, 1, 1)

  source.connect(processor)
  processor.connect(context.destination)

  return [null, { context, processor }]
}

/**
 * Underlying utility method to stop the current processor
 * if it exists and disconnect the microphone.
 */
export function stopProcessor() {
  stopRecord()
  if (context && source && processor) {
    source.disconnect(processor)
    processor.disconnect(context.destination)
  }
  context = source = processor = undefined
}
