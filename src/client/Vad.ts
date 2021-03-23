import { SpeechConfig, VadConfig, VadStatus } from './types'
import analyserFrequencyAverage from 'analyser-frequency-average'

const defaultConfig: VadConfig = {
  bufferLen: 1024,
  smoothingTimeConstant: 0.2,
  minCaptureFreq: 85, // in Hz
  maxCaptureFreq: 255, // in Hz
  noiseCaptureDuration: 1, // in s
  minNoiseLevel: 0.3, // from 0 to 1
  maxNoiseLevel: 0.7, // from 0 to 1
  avgNoiseMultiplier: 1.2,
  riseDelay: 0,
  fallDelay: 250,
  maxActive: 2000,
  onUpdate: () => {
    // noop
  },
  onVadChange: () => {
    // noop
  }
}

/**
 *  average frequency-based VAD
 *  logic from https://github.com/Jam3/voice-activity-detection
 */
export default class Vad {
  analyser: AnalyserNode
  private config: VadConfig

  private baseLevel: number
  private freqBins: Uint8Array
  private voiceScale: number
  private activityCounter: number

  private riseFrames: number
  private fallFrames: number
  private maxActiveFrames: number

  private envFreqRange: number[]
  private prevVadState: boolean
  private curVadState: boolean
  private vadActive: boolean
  private captureTimeout: number

  constructor(audioContext: AudioContext, config: SpeechConfig) {
    this.config = {
      ...defaultConfig,
      ...config.vad
    }

    this.baseLevel = 0.3
    this.voiceScale = 1

    this.activityCounter = 0
    this.riseFrames = 0
    this.fallFrames = 0
    this.maxActiveFrames = this.config.maxActive

    this.envFreqRange = []
    const fftWidth = config.fftWidth || 512
    this.freqBins = new Uint8Array(fftWidth)
    this.prevVadState = false
    this.curVadState = false
    this.vadActive = false
    this.captureTimeout = 1000

    this.analyser = audioContext.createAnalyser()
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant
    this.analyser.fftSize = fftWidth
  }

  /**
   * connects an AnalyserNode between the specified source and script processor
   * in the audio context so that incoming data can be analyzed for voice
   * activity. The node must be connected before `vadStatus` will work.
   */
  connect(source: MediaStreamAudioSourceNode, processor: ScriptProcessorNode) {
    source.connect(this.analyser)
    this.analyser.connect(processor)

    // we'll receive `bufferSize` samples at a time, so use this to determine
    // activity parameters
    const frameSize = processor.bufferSize
    const msPerFrame = frameSize / (source.context.sampleRate / 1000)
    this.riseFrames = Math.floor(this.config.riseDelay / msPerFrame)
    this.fallFrames = Math.floor(this.config.fallDelay / msPerFrame)
    this.maxActiveFrames = Math.floor(this.config.maxActive / msPerFrame)
  }

  disconnect() {
    this.analyser.disconnect()
  }

  /**
   * Analyzes sound for the amount of time specified by
   * `noiseCaptureDuration` to determine a base level of
   * background noise to discount during voice activity detection.
   *
   * The VAD can be run without calibration, but different browsers
   * and input methods can report different sample values for the same
   * level of background noise, so calibration before first use is recommended.
   *
   * The VAD must be `connect`ed before it can be calibrated
   */
  calibrate(onComplete: () => void) {
    if (this.analyser.numberOfOutputs === 0) {
      throw new Error('VAD is not connected')
    }

    setTimeout(() => {
      this.setLevels()
      onComplete()
    }, this.config.noiseCaptureDuration * 1000)
  }

  setLevels = () => {
    this.envFreqRange = this.envFreqRange
      .filter(function (val) {
        return val
      })
      .sort()
    const averageEnvFreq = this.envFreqRange.length
      ? this.envFreqRange.reduce(function (p, c) {
          return Math.min(p, c)
        }, 1)
      : this.config.minNoiseLevel || 0.1

    this.baseLevel = averageEnvFreq * this.config.avgNoiseMultiplier

    if (this.config.minNoiseLevel && this.baseLevel < this.config.minNoiseLevel) {
      this.baseLevel = this.config.minNoiseLevel
    }

    if (this.config.maxNoiseLevel && this.baseLevel > this.config.maxNoiseLevel) {
      this.baseLevel = this.config.maxNoiseLevel
    }

    this.voiceScale = 1 - this.baseLevel

    // console.log(`VAD: base level: ${this.baseLevel}`)
  }

  /**
   * A function to be used as the `onaudioprocess` method of a
   * `ScriptProcessorNode`. Analyzes each audio frame from the source
   * and fires `onUpdate` for every frame and `onVadChange` if the
   * voice activity status changes.
   */
  private monitor() {
    const { onVadChange, onUpdate } = this.config
    const average = this.setActive()

    if (this.prevVadState !== this.vadActive) {
      this.prevVadState = this.vadActive
      onVadChange(this.vadActive)
    }

    onUpdate(Math.max(0, average - this.baseLevel) / this.voiceScale)
  }

  /**
   * Get the voice activity status for the last frame of audio
   * analyzed by the VAD.
   */
  vadStatus(): VadStatus {
    this.setActive()

    let changed = false
    if (this.prevVadState !== this.vadActive) {
      changed = true
      this.prevVadState = this.vadActive
    }

    return { changed: changed, active: this.vadActive }
  }

  private setActive(): number {
    this.analyser.getByteFrequencyData(this.freqBins)

    const average = analyserFrequencyAverage(
      this.analyser,
      this.freqBins,
      this.config.minCaptureFreq,
      this.config.maxCaptureFreq
    )

    const isSpeech = average >= this.baseLevel
    if (isSpeech == this.curVadState) {
      this.activityCounter++
    } else {
      this.curVadState = isSpeech
      this.activityCounter = 1
    }

    if (this.curVadState != this.vadActive) {
      if (this.curVadState && this.activityCounter >= this.riseFrames) {
        this.vadActive = true
      }
      if (!this.curVadState && this.activityCounter >= this.fallFrames) {
        this.vadActive = false
      }
    } else if (this.activityCounter >= this.maxActiveFrames) {
      // max activity timeout
      this.curVadState = this.vadActive = false
    }

    return average
  }
}
