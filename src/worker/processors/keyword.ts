import * as tf from '@tensorflow/tfjs'

import { CommandModels, SpeechContext, SpeechProcessor } from '../types'
import { SpeechConfig, SpeechEvent, SpeechEventType } from '../../client/types'

import RingBuffer from '../RingBuffer'

const defaultConfig = {
  melLength: 110,
  melWidth: 40,
  encodeWidth: 128,
  hopLength: 10,
  keywordThreshold: 0.5
}

type KeywordOnlyConfig = Omit<SpeechConfig, 'wakeThreshold' | 'baseWakewordUrl' | 'vad'>
type KeywordRecognizerConfig = Omit<KeywordOnlyConfig, 'baseKeywordUrl' | 'keywordClasses'> &
  Required<Pick<KeywordOnlyConfig, 'baseKeywordUrl' | 'keywordClasses'>>

/**
 * KeywordRecognizer is a speech pipeline component that provides the ability
 * to recognize one or more keyword phrases during pipeline activation.
 *
 * The incoming raw audio signal is first normalized, converted to
 * the magnitude Short-Time Fourier Transform (STFT) representation over a
 * hopped sliding window, and converted to a mel spectrogram via a "filter"
 * Tensorflow model. These mel frames are batched together
 * into a sliding window.
 *
 * The mel spectrogram represents the features to be passed to the
 * autoregressive encoder (usually an rnn or crnn), which is implemented in
 * an "encode" Tensorflow model. This encoder outputs an encoded vector and a
 * state vector. The encoded vectors are batched together into a sliding
 * window for classification, and the state vector is used to perform the
 * running autoregressive transduction over the mel frames.
 *
 * The "detect" Tensorflow model takes the encoded sliding window and outputs
 * a set of independent posterior values in the range [0, 1], one per keyword
 * class.
 *
 * During detection, the highest scoring posterior is chosen as the
 * recognized class, and if its value is higher than the configured
 * threshold, that class is reported to the client through the speech
 * recognition event. Otherwise, a timeout event occurs. Note
 * that the detection model is only run on the frame in which the speech
 * context is deactivated, similar to the end-of-utterance mechanism used by
 * other speech recognizers.
 *
 * The keyword recognizer can be used as a stand-alone speech recognizer,
 * using the VAD/timeout (or other activator) to manage activations.
 * Alternatively, the recognizer can be used along with a wakeword detector
 * to manage activations, in a two-stage wakeword/recognizer pattern.
 *
 * This pipeline component supports the following configuration properties:
 *
 *   1. **keywordClasses** (string[], required): ordered list of class names
 *      for the keywords; the name corresponding to the
 *      most likely class will be returned in the transcript field when the
 *      recognition event is raised
 *  1. **baseKeywordUrl** (string, required): The URL to a root folder
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
 *  1. **keywordThreshold** (double): the threshold of the classifier's
 *     posterior output, above which the trigger activates the pipeline,
 *     in the range [0, 1]
 */
export default class KeywordRecognizer implements SpeechProcessor {
  private config: Required<KeywordRecognizerConfig>
  private models: CommandModels
  private hopSamples: number
  private sampleWindow = new RingBuffer<number>(0)
  private encodeWindow = new RingBuffer<tf.Tensor>(0)
  private encodeState = tf.zeros([1])
  private frameWindow = new RingBuffer<tf.Tensor>(0)
  private vadActive = false

  static async create(config: SpeechConfig) {
    if (!config.baseKeywordUrl) {
      throw new Error('keyword URL required')
    }
    if (!config.keywordClasses || config.keywordClasses.length === 0) {
      throw new Error('keyword classes required')
    }
    config.sampleRate = Number(config.sampleRate)
    if (isNaN(config.sampleRate)) {
      throw new Error('sampleRate is required')
    }
    const models = await KeywordRecognizer.loadModels(config.baseKeywordUrl, config.fftWidth)
    return new KeywordRecognizer(models, config as KeywordRecognizerConfig)
  }

  constructor(models: CommandModels, options: KeywordRecognizerConfig) {
    this.models = models
    const config = (this.config = { ...defaultConfig, ...options })

    // number of samples to slide the window for each filter run
    this.hopSamples = config.hopLength * (config.sampleRate / 1000)
    this.sampleWindow = new RingBuffer<number>(config.fftWidth)

    const melSamples = (config.melLength * config.sampleRate) / 1000 / this.hopSamples
    this.frameWindow = new RingBuffer<tf.Tensor>(melSamples)
    const frameFill = tf.zeros([config.melWidth])
    this.frameWindow.fill(frameFill)

    const detectIn = this.models.detect.inputs[0].shape
    if (detectIn) {
      const encodeLength = detectIn[1]
      const encodeWidth = detectIn[detectIn.length - 1]

      this.encodeWindow = new RingBuffer<tf.Tensor>(encodeLength)
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

  static async loadModels(baseUrl: string, fftWidth: number): Promise<CommandModels> {
    return Promise.all([
      tf.loadGraphModel(`${baseUrl}/filter_${fftWidth}/model.json`),
      tf.loadGraphModel(`${baseUrl}/encode/model.json`),
      tf.loadGraphModel(`${baseUrl}/detect/model.json`)
    ]).then((models) => {
      return { filter: models[0], encode: models[1], detect: models[2] }
    })
  }

  async process(context: SpeechContext, frame: number[]) {
    for (const sample of frame) {
      await this.sample(context, sample)
    }

    if (!context.isActive && this.vadActive) {
      await this.classify(context)
    }

    this.vadActive = context.isActive
  }

  async sample(context: SpeechContext, sample: number) {
    this.sampleWindow.write(sample)
    if (this.sampleWindow.isFull()) {
      if (context.isActive) {
        await this.filter()
      }
      this.sampleWindow.rewind().seek(this.hopSamples)
    }
  }

  filter() {
    const frame = this.sampleWindow.toArray()
    const result = this.models.filter.execute(tf.stack(frame))
    const filtered = Array.isArray(result) ? result[0] : result
    this.frameWindow.rewind().seek(1)
    this.frameWindow.write(filtered)
    return this.encode()
  }

  async encode() {
    const filtered = this.frameWindow.toArray()
    const stacked = tf.stack(filtered)
    const input = [tf.expandDims(stacked), this.encodeState]
    const result = (await this.models.encode.executeAsync(input)) as tf.Tensor[]
    this.encodeWindow.rewind().seek(1)
    this.encodeWindow.write(tf.squeeze(result[0]))
    this.encodeState = tf.squeeze(result[1], [0])
  }

  async classify(context: SpeechContext) {
    const encoded = this.encodeWindow.toArray()
    const stacked = tf.stack(encoded)
    const input = tf.expandDims(stacked)
    const result = this.models.detect.execute(input)
    const detected = Array.isArray(result) ? result[0] : result
    // look up class
    const clazz = tf.argMax(detected, 1).dataSync()[0]
    const keyword = this.config.keywordClasses[clazz]
    const confidence = tf.max(detected).dataSync()[0]

    // console.log(`keyword: ${keyword} (${confidence.toFixed(6)})`)

    const event: SpeechEvent = { type: SpeechEventType.Timeout }

    if (confidence > this.config.keywordThreshold) {
      event.transcript = keyword
      event.confidence = confidence
      event.type = SpeechEventType.Recognize
    }
    context.lastEvent = event

    if (context.dispatch) {
      context.dispatch(context.lastEvent)
    }

    this.reset()
  }

  reset() {
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
