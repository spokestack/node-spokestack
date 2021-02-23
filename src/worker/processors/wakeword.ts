import RingBuffer from '../RingBuffer'
import { EventType, SpeechConfig, SpeechEvent } from '../../client/types'
import { CommandModels, SpeechContext, SpeechProcessor } from '../types'
import type { Tensor } from '@tensorflow/tfjs'

const defaultConfig = {
  melLength: 10,
  melWidth: 40,
  encodeWidth: 128,
  hopLength: 10,
  wakeThreshold: 0.5
}

type WakewordOnlyConfig = Omit<
  SpeechConfig,
  'keywordThreshold' | 'baseKeywordUrl' | 'keywordClasses' | 'vad'
>
export type WakewordTriggerConfig = Omit<WakewordOnlyConfig, 'baseWakewordUrl'> &
  Required<Pick<WakewordOnlyConfig, 'baseWakewordUrl'>>

/**
 * WakewordTrigger is a speech pipeline component that provides wakeword
 * detection for activating downstream components. It uses a TensorFlow-lite
 * binary classifier to detect keyword phrases. Once a wakeword phrase is
 * detected, the pipeline is activated. the pipeline remains active until the
 * user stops talking or the activation timeout is reached.
 *
 * The incoming raw audio signal is normalized, converted to
 * the magnitude short-time fourier transform (stft) representation over a
 * hopped sliding window, and converted to a mel spectrogram via a "filter"
 * TensorFlow model. These mel frames are batched together into a
 * sliding window.
 *
 * The mel spectrogram represents the features to be passed to the
 * autoregressive encoder (usually an rnn or crnn), which is implemented in
 * an "encode" TensorFlow model. This encoder outputs an encoded vector and a
 * state vector. The encoded vectors are batched together into a sliding
 * window for classification, and the state vector is used to perform the
 * running autoregressive transduction over the mel frames.
 *
 * The "detect" TensorFlow model takes the encoded sliding window and outputs
 * a single posterior value in the range [0, 1]. Values closer to 1 indicate
 * a detected keyword phrase; values closer to 0 indicate non-keyword speech.
 * This classifier is commonly implemented as an attention mechanism over the
 * encoder window.
 *
 * The detector's outputs are then compared against a configured threshold,
 * in order to determine whether to activate the pipeline. if the posterior
 * is greater than the threshold, the activation occurs.
 *
 * This component supports the following configuration properties:
 *
 *  1. **baseWakewordUrl** (string, required): The URL to a root folder
 *     containing `filter`, `encode`, and `detect` subfolders containing the
 *     TensorFlowJS models.
 *  1. **fftWidth** (integer): The size of the signal window used
 *      to calculate the stft, in number of samples - should be a power of
 *      2 for maximum efficiency
 *  1. **hopLength** (integer): The length of time to skip each
 *      time the overlapping stft is calculated, in milliseconds
 *  1. **melLength** (integer): The length of the mel spectrogram
 *      used as an input to the encoder, in milliseconds
 *  1. **melWidth** (integer): The size of each mel spectrogram
 *      frame, in number of filterbank components
 *  1. **encodeWidth** (integer): the size of the encoder output,
 *      in vector units
 *  1. **wakeThreshold** (double): the threshold of the classifier's
 *     posterior output, above which the trigger activates the pipeline,
 *     in the range [0, 1]
 */
export default class WakewordTrigger implements SpeechProcessor {
  private config: Required<WakewordTriggerConfig>
  private models: CommandModels
  private hopSamples: number
  private sampleWindow = new RingBuffer<number>(0)
  private encodeWindow = new RingBuffer<Tensor>(0)
  private encodeState = self.tf.zeros([1])
  private frameWindow = new RingBuffer<Tensor>(0)
  private vadActive = false

  static async create(config: SpeechConfig) {
    if (!config.baseWakewordUrl) {
      throw new Error('wakeword URL required')
    }
    const models = await WakewordTrigger.loadModels(config.baseWakewordUrl)
    return new WakewordTrigger(models, config as WakewordTriggerConfig)
  }

  constructor(models: CommandModels, options: WakewordTriggerConfig) {
    const tf = self.tf
    const config = (this.config = { ...defaultConfig, ...options })
    this.models = models

    config.sampleRate = Number(config.sampleRate)
    if (isNaN(config.sampleRate)) {
      throw new Error('sampleRate is required')
    }

    // number of samples to slide the window for each filter run
    this.hopSamples = config.hopLength * (config.sampleRate / 1000)
    this.sampleWindow = new RingBuffer<number>(config.fftWidth)
    const melSamples = (config.melLength * config.sampleRate) / 1000 / this.hopSamples
    this.frameWindow = new RingBuffer<Tensor>(melSamples)
    const frameFill = tf.zeros([config.melWidth])
    this.frameWindow.fill(frameFill)

    const detectIn = this.models.detect.inputs[0].shape
    if (detectIn) {
      const encodeLength = detectIn[1]
      const encodeWidth = detectIn[detectIn.length - 1]

      this.encodeWindow = new RingBuffer<Tensor>(encodeLength)
      const encodeFill = tf.fill([encodeWidth], -1.0)
      this.encodeWindow.fill(encodeFill)
    } else {
      throw new Error('unable to load the detect model')
    }

    const encodeIn = this.models.encode.inputs[1].shape
    if (encodeIn) {
      this.encodeState = tf.zeros([1, encodeIn[1]])
    } else {
      throw new Error('unable to load the encode model')
    }
  }

  static async loadModels(baseUrl: string): Promise<CommandModels> {
    const tf = self.tf
    return Promise.all([
      tf.loadGraphModel(`${baseUrl}/filter/model.json`),
      tf.loadGraphModel(`${baseUrl}/encode/model.json`),
      tf.loadGraphModel(`${baseUrl}/detect/model.json`)
    ]).then((models) => {
      return { filter: models[0], encode: models[1], detect: models[2] }
    })
  }

  async process(context: SpeechContext, frame: number[]) {
    for (const sample of frame) {
      if (!context.isActive) {
        await this.sample(context, sample)
      }
    }

    // reset on vad deactivation
    if (this.vadActive && !context.isSpeech) {
      this.reset()
    }

    this.vadActive = context.isSpeech
  }

  async sample(context: SpeechContext, sample: number) {
    this.sampleWindow.write(sample)
    if (this.sampleWindow.isFull()) {
      if (context.isSpeech) {
        await this.filter(context)
      }
      this.sampleWindow.rewind().seek(this.hopSamples)
    }
  }

  async filter(context: SpeechContext) {
    const frame = this.sampleWindow.toArray()
    const filtered = this.models.filter.execute([self.tf.stack(frame)]) as Tensor
    this.frameWindow.rewind().seek(1)
    this.frameWindow.write(filtered)
    await this.encode(context)
  }

  async encode(context: SpeechContext) {
    const tf = self.tf
    const filtered = this.frameWindow.toArray()
    const stacked = tf.stack(filtered)
    const input = [tf.expandDims(stacked), this.encodeState]
    const result = (await this.models.encode.executeAsync(input)) as Tensor[]
    this.encodeWindow.rewind().seek(1)
    this.encodeWindow.write(tf.squeeze(result[0]))
    this.encodeState = result[1]
    await this.detect(context)
  }

  async detect(context: SpeechContext) {
    const tf = self.tf
    const encoded = this.encodeWindow.toArray()
    const stacked = tf.stack(encoded)
    const input = tf.expandDims(stacked)
    const detected = this.models.detect.execute([input]) as Tensor
    const confidence = tf.max(detected).dataSync()[0]

    // console.log(`wakeword: ${confidence.toFixed(6)}`)

    if (confidence > this.config.wakeThreshold) {
      const event: SpeechEvent = {
        confidence: confidence,
        eventType: EventType.Activate
      }
      context.lastEvent = event

      if (context.dispatch) {
        context.dispatch(event)
      }
    }
  }

  reset() {
    const tf = self.tf
    this.sampleWindow.reset()

    const frameFill = tf.zeros([this.config.melWidth])
    this.frameWindow.reset().fill(frameFill)

    const detectIn = this.models.detect.inputs[0].shape as number[]
    const encodeWidth = detectIn[detectIn.length - 1]
    const encodeFill = tf.fill([encodeWidth], -1.0)
    this.encodeWindow.reset().fill(encodeFill)
    const encodeIn = this.models.encode.inputs[1].shape as number[]
    this.encodeState = tf.zeros([1, encodeIn[1]])
  }
}
