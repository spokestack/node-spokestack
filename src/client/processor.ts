import { startRecord, stopRecord } from './mic'

declare global {
  interface Window {
    // Support: Safari
    webkitAudioContext: AudioContext
  }
  interface Navigator {
    __polyfilledMediaDevices: boolean
  }
}

let context: AudioContext | undefined
let source: MediaStreamAudioSourceNode | undefined
let processor: ScriptProcessorNode | undefined

export interface ProcessorReturnValue {
  context: AudioContext
  processor: ScriptProcessorNode
}

export async function startProcessor(): Promise<[Error] | [null, ProcessorReturnValue]> {
  stopProcessor()
  const stream = await startRecord()
  if (!stream) {
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

export function stopProcessor() {
  stopRecord()
  if (context && source && processor) {
    source.disconnect(processor)
    processor.disconnect(context.destination)
  }
  context = source = processor = undefined
}
