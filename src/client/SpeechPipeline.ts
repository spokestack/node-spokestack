import { SpeechConfig, SpeechEvent, SpeechEventType, Stage } from './types'
import { startRecord, stopRecord } from './mic'

import Vad from './Vad'

/** A callback function to be called when an event occurs */
export type PipelineEventHandler = (evt: SpeechEvent) => void

const defaultSpeechConfig = {
  sampleRate: 16000,
  fftWidth: 512,
  hopLength: 10
}

interface SpeechPipelineConfig {
  speechConfig: SpeechConfig
  stages: Stage[]
  workerUrl?: string
  onEvent?: PipelineEventHandler
}

/**
 * Spokestack's speech pipeline comprises a voice activity detection (VAD)
 * component and a series of `stage`s that manage voice interaction.
 *
 * Audio is processed off the main thread, currently via a
 * `ScriptProcessorNode` and web worker. Each chunk of audio samples is
 * passed to the worker along with an indication of speech activity, and
 * each of the stages processes it in order to, e.g., detect whether the user
 * said a wakeword or transcribe an occurrence of a keyword. See documentation
 * for the individual stages for more information on their purpose.
 */
export default class SpeechPipeline {
  private config: SpeechPipelineConfig
  private context: AudioContext
  private gainNode: GainNode
  private processor: ScriptProcessorNode
  private source?: MediaStreamAudioSourceNode
  private vad: Vad
  private worker?: Worker

  /**
   * Create a new speech pipeline.
   *
   * @param config A SpeechPipelineConfig object describing basic
   * pipeline configuration as well as options specific to certain stages
   * (URLs to models, classes for keyword models, etc.).
   */
  constructor(config: SpeechPipelineConfig) {
    this.config = {
      ...config,
      speechConfig: {
        ...defaultSpeechConfig,
        ...config.speechConfig
      }
    }
    const speechConfig = this.config.speechConfig
    let opts = {}
    if (speechConfig.sampleRate > 0) {
      opts = { sampleRate: speechConfig.sampleRate }
    }
    const context = (this.context = new (window.AudioContext || window.webkitAudioContext)(opts))
    if (context.sampleRate !== speechConfig.sampleRate) {
      console.error('Could not set sampleRate on the AudioContext')
      throw new Error('unsupported_browser')
    }

    const bufferSize = 512
    const processor = (this.processor = context.createScriptProcessor(bufferSize, 1, 1))

    this.vad = new Vad(context, speechConfig)

    // create a muted GainNode to let the scriptprocessor work in chrome
    const gainNode = (this.gainNode = context.createGain())
    gainNode.gain.value = 0.0
    processor.connect(gainNode)
    gainNode.connect(context.destination)
  }

  /**
   * Start processing audio with the pipeline. If this is the first use of the
   * pipeline, the microphone permission will be requested from the user if
   * they have not already granted it.
   */
  async start(): Promise<SpeechPipeline> {
    this.worker = await this.initWorker()
    const stream = await startRecord()
    if (!stream) {
      throw new Error(
        `There was a problem starting the microphone. ${
          navigator.__polyfilledMediaDevices
            ? 'This browser does not support microphone access.'
            : 'Please check the permission and try again.'
        }`
      )
    }

    try {
      this.source = this.context.createMediaStreamSource(stream)
    } catch (err) {
      // This is thrown by Firefox, which will create an `AudioContext`
      // with a given sample rate, but won't adjust the sample rate of a
      // user's input device, connect an input stream to an audio context
      // with a different sample rate, or expose `sampleRate` in the
      // constraints, capabilities, or settings of the stream's tracks
      // so you can make a new context before the error happens.
      if (err instanceof DOMException && err.name === 'NotSupportedError') {
        throw new Error('unsupported_browser')
      } else {
        throw err
      }
    }

    this.vad.connect(this.source, this.processor)

    return new Promise<SpeechPipeline>((resolve) => {
      this.vad.calibrate(() => {
        this.processor.addEventListener('audioprocess', this.sendBuffer)
        resolve(this)
      })
    })
  }

  private initWorker(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      let resolved = false
      const config = this.config
      const worker = new Worker(config.workerUrl || '/spokestack-web-worker.js')
      const workerConfig = { speechConfig: config.speechConfig, stages: config.stages }
      worker.addEventListener('message', (event) => {
        if (event.data) {
          if (event.data.initialized) {
            resolved = true
            resolve(worker)
            return
          }
          // Pass all messages to the client, including errors
          if (config.onEvent) {
            config.onEvent(event.data)
          }
          if (!event.data.error) {
            return
          }
        }
        console.error(event)
        this.stop()
        if (!resolved) {
          reject(
            new Error(
              event.data?.error || 'Worker encountered an error and stopped the speech pipeline.'
            )
          )
          return
        }
      })
      worker.addEventListener('messageerror', (event) => {
        console.error(event)
        if (!resolved) {
          reject(new Error('Worker hit a serialize error on initialize.'))
          return
        }
        if (config.onEvent) {
          config.onEvent({
            type: SpeechEventType.Error,
            error: 'A web worker message could not be serialized'
          })
        }
      })
      worker.addEventListener('error', (event) => {
        console.error(event)
        this.stop()
        if (!resolved) {
          reject(new Error('There was a problem initializing the web worker.'))
          return
        }
        if (config.onEvent) {
          config.onEvent({
            type: SpeechEventType.Error,
            error: 'The web worker hit an error: ' + event.message
          })
        }
      })
      worker.postMessage({ config: workerConfig })
    })
  }

  private sendBuffer = (e: AudioProcessingEvent) => {
    if (this.vad && this.worker) {
      // check vad
      const vadStatus = this.vad.vadStatus()

      // console.log(`VAD status: ${JSON.stringify(vadStatus)}`)
      // send vad status and audio to worker
      const data = e.inputBuffer.getChannelData(0)
      this.worker.postMessage({ audio: data, vad: vadStatus.active })
    }
  }

  /**
   * Stop the pipeline, destroying the internal audio processors and
   * relinquishing the microphone.
   */
  stop() {
    stopRecord()
    this.processor.removeEventListener('audioprocess', this.sendBuffer)
    this.disconnect()
    if (this.worker) {
      this.worker.terminate()
    }
  }

  private disconnect() {
    if (this.gainNode && this.processor && this.vad) {
      try {
        this.processor.disconnect(this.gainNode)
      } catch (e) {}
      this.vad.disconnect()
      this.gainNode.disconnect()
    }
    if (this.source) {
      this.source.disconnect()
    }
  }
}
